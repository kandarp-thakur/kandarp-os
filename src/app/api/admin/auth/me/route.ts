/**
 * GET /api/admin/auth/me — return the current session's safe user.
 *
 * Used by the admin shell on load to hydrate the current user (name, role,
 * avatar) and drive RBAC-gated UI. Returns 401 if unauthenticated — the
 * client redirects to /admin/login.
 */

import { findByField } from "@/lib/admin/repo";
import { error, json, requireAuth } from "@/lib/admin/api";
import { ensureSeeded } from "@/lib/admin/seed";
import type { User } from "@/lib/admin/types";

export async function GET() {
    // Seed the store on first boot (idempotent — no-op after the first run).
    await ensureSeeded();

    const session = await requireAuth();
    if (session instanceof Response) return session;

    const user = findByField<User>("users", "email", session.email);
    if (!user) return error("User not found", 404, 404);

    return json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totpEnabled: user.totpEnabled,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
    });
}
