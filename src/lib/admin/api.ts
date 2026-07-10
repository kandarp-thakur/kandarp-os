/**
 * API helpers — the shared layer every admin route handler uses.
 *
 * Provides:
 *   • `requireAuth` — resolve the current session or 401.
 *   • `requirePermission` — resolve the session + check RBAC, or 403.
 *   • `json` / `error` — consistent JSON responses with the right status.
 *   • `parseBody` — validate a request body with a Zod schema, or 400.
 *   • `getQuery` — typed query-param extraction (pagination/sort/search).
 *
 * Keeping these here means every route handler is 5–10 lines of actual logic.
 */

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

import { getSession, logActivity } from "@/lib/admin/session";
import type { AdminSession } from "@/lib/admin/auth";
import { can, type Permission } from "@/lib/admin/rbac";
import type { QueryOptions } from "@/lib/admin/repo";

/** A successful JSON response (200). */
export function json<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/** An error JSON response with a consistent shape. */
export function error(
    message: string,
    status = 400,
    code?: number,
): NextResponse {
    return NextResponse.json(
        { error: message, code: code ?? status },
        { status },
    );
}

/** Resolve the current session or return a 401 response. */
export async function requireAuth(): Promise<AdminSession | NextResponse> {
    const session = await getSession();
    if (!session) return error("Unauthorized", 401, 401);
    return session;
}

/** Resolve the session + verify a permission, or return 401/403. */
export async function requirePermission(
    permission: Permission,
): Promise<AdminSession | NextResponse> {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;
    if (!can(session.role, permission)) {
        return error("Forbidden — insufficient permissions", 403, 403);
    }
    return session;
}

/** Validate a request body against a Zod schema, or return a 400. */
export async function parseBody<T>(
    req: Request,
    schema: ZodSchema<T>,
): Promise<T | NextResponse> {
    try {
        const raw = await req.json();
        return schema.parse(raw);
    } catch (err) {
        if (err instanceof Error && "issues" in err) {
            const issues = (
                err as { issues: { message: string; path: unknown[] }[] }
            ).issues;
            return error(
                `Validation failed: ${issues.map((i) => i.message).join(", ")}`,
                422,
            );
        }
        return error("Invalid JSON body", 400);
    }
}

/** Extract pagination/sort/search query options from a URL. */
export function getQuery(req: Request): QueryOptions {
    const url = new URL(req.url);
    const params = url.searchParams;
    const page = parseInt(params.get("page") ?? "1", 10);
    const pageSize = parseInt(params.get("pageSize") ?? "20", 10);
    const sort = params.get("sort") ?? undefined;
    const order = (params.get("order") as "asc" | "desc") ?? "asc";
    const search = params.get("search") ?? undefined;

    // Collect arbitrary filters (any param not in the reserved set).
    const reserved = new Set(["page", "pageSize", "sort", "order", "search"]);
    const filters: Record<string, unknown> = {};
    params.forEach((value, key) => {
        if (!reserved.has(key)) filters[key] = value;
    });

    return {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize:
            Number.isFinite(pageSize) && pageSize > 0
                ? Math.min(pageSize, 100)
                : 20,
        sort,
        order,
        search,
        filters: Object.keys(filters).length ? filters : undefined,
    };
}

/** Log an activity entry after a successful mutation. Fire-and-forget. */
export function audit(
    session: AdminSession,
    action: string,
    entity?: string,
    entityId?: string,
    details?: string,
): void {
    void logActivity({
        userId: session.sub,
        userName: session.name,
        action,
        entity,
        entityId,
        details,
    });
}
