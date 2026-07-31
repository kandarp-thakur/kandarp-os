import { logger } from "@backend/logging/logger";
import { error, json } from "@backend/middlewares/api";
import { contactSubmissionInputSchema } from "@backend/schemas/types";
import { createContactSubmission } from "@backend/services/contact-submissions";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_BODY_BYTES = 32 * 1024;
const buckets = new Map<string, number[]>();

function clientAddress(req: Request): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

function isRateLimited(address: string): boolean {
    const now = Date.now();
    const recent = (buckets.get(address) ?? []).filter(
        (timestamp) => now - timestamp < WINDOW_MS,
    );
    recent.push(now);
    buckets.set(address, recent);

    if (buckets.size > 10_000) {
        for (const [key, hits] of buckets) {
            if (!hits.some((timestamp) => now - timestamp < WINDOW_MS)) {
                buckets.delete(key);
            }
        }
    }

    return recent.length > MAX_ATTEMPTS;
}

function hasValidOrigin(req: Request): boolean {
    const source = req.headers.get("origin") ?? req.headers.get("referer");
    const host = req.headers.get("host");
    if (!source || !host) return true;
    try {
        return new URL(source).host === host;
    } catch {
        return false;
    }
}

async function readBoundedJson(req: Request): Promise<unknown | Response> {
    if (!req.body) return error("Invalid JSON body", 400);

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;
    let text = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            bytesRead += value.byteLength;
            if (bytesRead > MAX_BODY_BYTES) {
                await reader.cancel();
                return error("Request body too large", 413);
            }
            text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
        return JSON.parse(text) as unknown;
    } catch {
        return error("Invalid JSON body", 400);
    } finally {
        reader.releaseLock();
    }
}

export async function POST(req: Request) {
    const contentLength = Number.parseInt(
        req.headers.get("content-length") ?? "0",
        10,
    );
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return error("Request body too large", 413);
    }
    if (!hasValidOrigin(req)) return error("Cross-site request blocked", 403);

    const address = clientAddress(req);
    if (isRateLimited(address)) {
        return error("Too many messages. Please try again later.", 429);
    }

    const rawBody = await readBoundedJson(req);
    if (rawBody instanceof Response) return rawBody;

    const parsedBody = contactSubmissionInputSchema.safeParse(rawBody);
    if (!parsedBody.success) {
        return error(
            `Validation failed: ${parsedBody.error.issues
                .map((issue) => issue.message)
                .join(", ")}`,
            422,
        );
    }
    const body = parsedBody.data;

    // Honeypot submissions receive the same outward success shape but are not
    // persisted. This avoids teaching automated senders how the trap works.
    if (body.website) return json({ ok: true }, 202);

    try {
        await createContactSubmission(
            {
                ...body,
                subject: body.subject ?? "",
                website: body.website ?? "",
            },
            {
                ipAddress: address,
                userAgent: req.headers.get("user-agent") ?? "",
            },
        );
        return json({ ok: true }, 201);
    } catch (err) {
        logger.error({ err }, "contact_submission.create_failed");
        return error("Unable to send your message right now", 503);
    }
}
