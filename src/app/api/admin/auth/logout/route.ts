/**
 * POST /api/admin/auth/logout — clear the session cookie.
 *
 * Logs the logout to the audit trail, then clears the cookie. Idempotent —
 * calling it without a session is a no-op (still 200).
 */

import { error, json } from "@/lib/admin/api";
import {
    clearSessionCookie,
    getSession,
    logActivity,
} from "@/lib/admin/session";

export async function POST() {
    const session = await getSession();
    if (session) {
        await logActivity({
            userId: session.sub,
            userName: session.name,
            action: "user.logout",
            level: "info",
        });
    }
    await clearSessionCookie();
    return json({ ok: true });
}

/** GET /api/admin/auth/logout — convenience for non-POST clients. */
export async function GET() {
    return error("Use POST to logout.", 405, 405);
}
