/**
 * POST /api/admin/auth/logout — clear the session cookie.
 *
 * Logs the logout to the audit trail, then clears the cookie. Idempotent —
 * calling it without a session is a no-op (still 200).
 */

import { error, json } from "@backend/middlewares/api";
import {
    clearSessionCookie,
    getSession,
    logActivity,
} from "@backend/auth/session";
import { revokeSession } from "@backend/auth/session-service";
import {
    withLogging,
    type RouteContext,
} from "@backend/middlewares/with-logging";

export const POST = withLogging(async (_req, { log }: RouteContext) => {
    const session = await getSession();
    if (session) {
        // Revoke the session row so the sid is immediately invalid.
        await revokeSession(session.sid);
        await logActivity({
            userId: session.sub,
            userName: session.name,
            action: "user.logout",
            level: "info",
        });
        log.info({ userId: session.sub }, "logout.success");
    }
    await clearSessionCookie();
    return json({ ok: true });
});

/** GET /api/admin/auth/logout — convenience for non-POST clients. */
export async function GET() {
    return error("Use POST to logout.", 405, 405);
}
