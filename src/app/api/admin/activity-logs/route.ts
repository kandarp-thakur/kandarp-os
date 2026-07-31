/**
 * GET /api/admin/activity-logs — list audit-log entries (audit:read).
 *
 * Supports the standard query params (page, pageSize, sort, search, filters)
 * via getQuery. Default sort is newest-first by timestamp.
 */

import { getQuery, json, requirePermission } from "@backend/middlewares/api";
import { query } from "@backend/repositories/repo";
import type { ActivityLog } from "@backend/schemas/types";

export async function GET(req: Request) {
    const session = await requirePermission("audit:read");
    if (session instanceof Response) return session;

    const opts = getQuery(req);
    // Default: newest first.
    if (!opts.sort) opts.sort = "timestamp";
    if (!opts.order) opts.order = "desc";

    const result = query<ActivityLog>("activityLogs", opts);
    return json(result);
}
