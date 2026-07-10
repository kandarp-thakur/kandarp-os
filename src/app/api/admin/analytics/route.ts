/**
 * GET  /api/admin/analytics — query analytics events (analytics:read)
 * POST /api/admin/analytics — ingest an analytics event (public, no auth)
 *
 * The POST endpoint is intentionally unauthenticated — it's the beacon
 * the public site calls to record pageviews, clicks, etc. It validates
 * the payload and writes to the analytics collection.
 *
 * The GET endpoint is for the admin dashboard's analytics screen.
 */

import { getQuery, json, parseBody, requirePermission } from "@/lib/admin/api";
import { create, query } from "@/lib/admin/repo";
import { analyticsEventSchema, type AnalyticsEvent } from "@/lib/admin/types";

const ingestSchema = analyticsEventSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
    timestamp: true,
});

export async function GET(req: Request) {
    const session = await requirePermission("analytics:read");
    if (session instanceof Response) return session;
    const result = query<AnalyticsEvent>("analytics", getQuery(req));
    return json(result);
}

export async function POST(req: Request) {
    // Public endpoint — no auth required (beacon from the public site).
    const body = await parseBody(req, ingestSchema);
    if (body instanceof Response) return body;

    const event = await create<AnalyticsEvent>(
        "analytics",
        {
            timestamp: new Date().toISOString(),
            type: body.type,
            path: body.path ?? "",
            referrer: body.referrer ?? "",
            country: body.country ?? "",
            device: body.device ?? "desktop",
            browser: body.browser ?? "",
            duration: body.duration ?? 0,
            meta: body.meta ?? {},
        },
        undefined,
    );

    return json({ ok: true, id: event.id }, 201);
}
