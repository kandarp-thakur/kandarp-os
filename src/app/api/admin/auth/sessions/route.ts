/**
 * Sessions API — /api/admin/auth/sessions
 *
 * GET    — list the current user's active sessions (device management).
 * DELETE — revoke a session by token, or all other sessions ("logout other
 *          devices"). The current session (the one making the request) is
 *          always preserved unless explicitly targeted.
 *
 * Security: a user can only manage their own sessions. The `sid` in the JWT
 * identifies the current device; every other active session is a separate
 * device/browser. Revoking a session immediately invalidates its JWT on the
 * next request (the `requireAuth` DB check rejects revoked sids).
 */

import { z } from "zod";

import { error, json, requireAuth } from "@backend/middlewares/api";
import { logActivity } from "@backend/auth/session";
import {
    listActiveSessions,
    revokeOtherSessions,
    revokeSession,
} from "@backend/auth/session-service";
import {
    withLogging,
    type RouteContext,
} from "@backend/middlewares/with-logging";

export const GET = withLogging(async (_req, { log }: RouteContext) => {
    const session = await requireAuth();
    if (session instanceof Response) return session;

    const sessions = await listActiveSessions(session.sub);

    log.debug({ userId: session.sub, count: sessions.length }, "sessions.list");

    return json({
        current: session.sid,
        sessions: sessions.map((s) => ({
            token: s.token,
            ip: s.ip,
            userAgent: s.userAgent,
            rememberMe: s.rememberMe,
            lastUsedAt: s.lastUsedAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
            isCurrent: s.token === session.sid,
        })),
    });
});

const revokeSchema = z.object({
    /** The session token to revoke. If omitted, revokes all OTHER sessions. */
    token: z.string().optional(),
});

export const DELETE = withLogging(async (req, { log }: RouteContext) => {
    const session = await requireAuth();
    if (session instanceof Response) return session;

    const body = await revokeSchema.safeParse(
        await req.json().catch(() => ({})),
    );
    if (!body.success) {
        return error("Invalid request body.", 400);
    }

    if (body.data.token) {
        // Prevent a user from revoking their own current session via this
        // endpoint (use /logout for that — it also clears the cookie).
        if (body.data.token === session.sid) {
            return error(
                "Use the logout endpoint to end your current session.",
                400,
            );
        }
        await revokeSession(body.data.token);
        log.info(
            { userId: session.sub, token: body.data.token.slice(0, 8) + "…" },
            "session.revoke",
        );
        await logActivity({
            userId: session.sub,
            userName: session.name,
            action: "session.revoke",
            level: "warning",
            details: `Revoked session ${body.data.token.slice(0, 8)}…`,
        });
    } else {
        // Revoke all sessions except the current one ("logout other devices").
        const count = await revokeOtherSessions(session.sub, session.sid);
        log.info({ userId: session.sub, count }, "session.revoke_others");
        await logActivity({
            userId: session.sub,
            userName: session.name,
            action: "session.revoke_others",
            level: "warning",
            details: `Revoked ${count} other session(s)`,
        });
    }

    return json({ ok: true });
});
