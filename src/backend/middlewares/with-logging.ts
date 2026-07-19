/**
 * Request logging middleware (HOF) — wraps a route handler with structured
 * request/response logging.
 *
 * Usage:
 *   export const POST = withLogging(async (req, ctx) => {
 *       const session = await requirePermission("users:write");
 *       ...
 *       return json({ ok: true });
 *   });
 *
 * For each request, the wrapper:
 *   1. Generates a correlation ID (`reqId`) and binds it to a child logger.
 *   2. Logs the request start (method, path, query, user agent).
 *   3. Runs the handler, passing the logger + reqId via the context object.
 *   4. Logs the response (status, duration in ms).
 *   5. Catches and logs any uncaught error (with stack trace) before
 *      re-throwing as a 500 — the client never sees the raw error.
 *
 * The correlation ID is returned in the `x-request-id` response header so a
 * user reporting a bug can quote the ID and support can find the exact log
 * lines in the aggregator.
 *
 * Security: the logger redacts secrets (see `logger.ts`), and we never log
 * request bodies (which may contain passwords) — only method, path, query,
 * and status. Headers are logged selectively (user-agent only).
 *
 * Server-only: uses Pino (Node runtime). Not for Edge middleware.
 *
 * @see docs/backend/logging.md — request lifecycle, correlation IDs.
 */

import { NextResponse } from "next/server";

import {
    newRequestId,
    requestLogger,
    REQUEST_ID_HEADER,
} from "@backend/middlewares/request-context";
import type { Logger } from "@backend/logging/logger";

/** Context passed to every wrapped route handler. */
export interface RouteContext {
    /** Correlation ID for this request (also in the `x-request-id` header). */
    reqId: string;
    /** Child logger with `reqId` bound — use this for all per-request logs. */
    log: Logger;
}

/** A route handler wrapped by `withLogging`. */
type Handler<T extends unknown[]> = (
    req: Request,
    ctx: RouteContext,
    ...rest: T
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler with request lifecycle logging.
 *
 * The handler receives a `RouteContext` as its second argument (after the
 * standard `Request`). Any additional args (e.g. Next.js route params) are
 * passed through.
 */
export function withLogging<T extends unknown[] = []>(
    handler: Handler<T>,
): (req: Request, ...rest: T) => Promise<NextResponse> {
    return async (req, ...rest) => {
        const reqId = newRequestId();
        const log = requestLogger(reqId);

        const url = new URL(req.url);
        const start = Date.now();

        // Log the request start. We deliberately exclude the body (may contain
        // secrets) and most headers (fingerprinting risk). User-agent is useful
        // for debugging client issues and is not sensitive.
        log.info(
            {
                method: req.method,
                path: url.pathname,
                query: url.search || undefined,
                ua: req.headers.get("user-agent") ?? undefined,
            },
            "request.start",
        );

        let response: NextResponse;
        try {
            response = await handler(req, { reqId, log }, ...rest);
        } catch (err) {
            // Uncaught error — log with full stack trace, then return a generic
            // 500. The client never sees the raw error message (which could
            // leak internals — DB connection strings, file paths, etc.).
            const duration = Date.now() - start;
            log.error(
                {
                    method: req.method,
                    path: url.pathname,
                    durationMs: duration,
                    err,
                },
                "request.error",
            );
            response = NextResponse.json(
                { error: "Internal server error", code: 500, requestId: reqId },
                { status: 500 },
            );
        }

        // Attach the correlation ID to the response so clients can reference it.
        response.headers.set(REQUEST_ID_HEADER, reqId);

        const duration = Date.now() - start;
        const status = response.status;

        // Log the response. 4xx = warn, 5xx = error, 2xx/3xx = info.
        const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
        log[level](
            {
                method: req.method,
                path: url.pathname,
                status,
                durationMs: duration,
            },
            "request.end",
        );

        return response;
    };
}
