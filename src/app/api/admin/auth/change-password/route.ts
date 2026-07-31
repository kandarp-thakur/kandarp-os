/**
 * POST /api/admin/auth/change-password — change the current user's password.
 *
 * Requires the current password (re-authentication) to prevent a hijacked
 * session from changing the password silently. On success, all OTHER sessions
 * are revoked (the current session stays active) so every other device is
 * forced to re-authenticate with the new password.
 *
 * Security:
 *   • The current password is verified before the change (re-auth).
 *   • The new password is hashed with Argon2id.
 *   • All sessions except the current one are revoked.
 *   • The change is logged to the audit trail.
 */

import { z } from "zod";

import { error, json, requireAuth } from "@backend/middlewares/api";
import { hashPassword, verifyPassword } from "@backend/auth/auth";
import { logActivity } from "@backend/auth/session";
import { revokeOtherSessions } from "@backend/auth/session-service";
import { findById, update } from "@backend/repositories/repo";
import {
    withLogging,
    type RouteContext,
} from "@backend/middlewares/with-logging";
import type { User } from "@backend/schemas/types";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = withLogging(async (req, { log }: RouteContext) => {
    const session = await requireAuth();
    if (session instanceof Response) return session;

    const body = await changePasswordSchema.safeParse(
        await req.json().catch(() => ({})),
    );
    if (!body.success) {
        const msg = body.error.issues.map((i) => i.message).join(", ");
        return error(msg, 400);
    }

    const { currentPassword, newPassword } = body.data;

    // Reject if the new password is the same as the current one.
    if (currentPassword === newPassword) {
        return error(
            "New password must be different from the current one.",
            400,
        );
    }

    // Re-authenticate: verify the current password before changing.
    const user = await findById<User>("users", session.sub);
    if (!user) return error("User not found", 404, 404);

    const verified = await verifyPassword(currentPassword, user.passwordHash);
    if (!verified) {
        log.warn({ userId: session.sub }, "password_change.failed.bad_current");
        return error("Current password is incorrect.", 401, 401);
    }

    // Hash the new password with Argon2id and persist.
    const newHash = await hashPassword(newPassword);
    await update<User>("users", session.sub, { passwordHash: newHash });

    // Revoke all sessions except the current one (force other devices to
    // re-authenticate with the new password).
    const revoked = await revokeOtherSessions(session.sub, session.sid);

    log.info(
        { userId: session.sub, revokedSessions: revoked },
        "password_change.success",
    );

    await logActivity({
        userId: session.sub,
        userName: session.name,
        action: "user.password_change",
        level: "warning",
        details: `Revoked ${revoked} other session(s)`,
    });

    return json({ ok: true, revokedSessions: revoked });
});
