/**
 * GET    /api/admin/users/[id]    — read one user (secrets stripped)
 * PATCH  /api/admin/users/[id]    — update a user (users:write)
 * DELETE /api/admin/users/[id]    — delete a user (users:delete)
 *
 * Special rules:
 *   • The owner account cannot be deleted or demoted (protects lockout).
 *   • Only the owner can assign the owner role.
 *   • Password updates go through a dedicated `password` field that is
 *     hashed before storage — the plaintext is never persisted.
 */

import { z } from "zod";

import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { findById, remove, update } from "@backend/repositories/repo";
import { hashPassword, type AdminRole } from "@backend/auth/auth";
import { revokeAllSessions } from "@backend/auth/session-service";
import type { SafeUser, User } from "@backend/schemas/types";

function toSafe(user: User): SafeUser {
    const { passwordHash: _p, totpSecret: _t, ...safe } = user;
    return safe;
}

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(["owner", "admin", "editor", "viewer"]).optional(),
    avatar: z.string().optional(),
    status: z.enum(["active", "suspended", "invited"]).optional(),
    /** Optional new password — hashed before storage. */
    password: z.string().min(8).optional(),
    totpEnabled: z.boolean().optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("users:read");
    if (session instanceof Response) return session;
    const { id } = await params;
    const user = await findById<User>("users", id);
    if (!user) return error("User not found", 404, 404);
    return json(toSafe(user));
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("users:write");
    if (session instanceof Response) return session;
    const { id } = await params;
    const user = await findById<User>("users", id);
    if (!user) return error("User not found", 404, 404);

    const body = await parseBody(req, updateUserSchema);
    if (body instanceof Response) return body;

    // Only the owner can assign the owner role.
    if (body.role === "owner" && session.role !== "owner") {
        return error("Only the owner can assign the owner role", 403, 403);
    }

    // The owner cannot be demoted (prevents accidental lockout).
    if (user.role === "owner" && body.role && body.role !== "owner") {
        return error("The owner role cannot be removed", 403, 403);
    }

    // Build the patch — hash the password if one was provided.
    const patch: Partial<User> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.email !== undefined) patch.email = body.email.toLowerCase();
    if (body.role !== undefined) patch.role = body.role as AdminRole;
    if (body.avatar !== undefined) patch.avatar = body.avatar;
    if (body.status !== undefined) patch.status = body.status;
    if (body.totpEnabled !== undefined) patch.totpEnabled = body.totpEnabled;
    if (body.password) patch.passwordHash = await hashPassword(body.password);

    const updated = await update<User>("users", id, patch, session.sub);

    // Security: a password change invalidates all existing sessions so the
    // user must re-authenticate on every device. A role change or suspension
    // also revokes sessions so the new role/permissions take effect immediately.
    if (body.password || body.role || body.status === "suspended") {
        await revokeAllSessions(id);
    }

    audit(
        session,
        "user.update",
        "users",
        id,
        body.password ? "password reset" : undefined,
    );
    if (!updated) return json({ error: "User not found" }, 404);
    return json(toSafe(updated));
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("users:delete");
    if (session instanceof Response) return session;
    const { id } = await params;
    const user = await findById<User>("users", id);
    if (!user) return error("User not found", 404, 404);

    // The owner cannot be deleted.
    if (user.role === "owner") {
        return error("The owner account cannot be deleted", 403, 403);
    }
    // A user cannot delete themselves.
    if (user.id === session.sub) {
        return error("You cannot delete your own account", 403, 403);
    }

    await remove("users", id);
    audit(session, "user.delete", "users", id);
    return json({ ok: true });
}
