/**
 * Session Service — Prisma-backed session lifecycle management.
 *
 * Persists sessions to the `Session` table so they can be revoked (per-device
 * logout, force-logout-everywhere) and listed (device management UI). The JWT
 * remains stateless for performance (edge middleware verifies the signature
 * without a DB hit), but every protected request re-checks the `sid` against
 * the database so a revoked session is immediately invalid.
 *
 * Security model:
 *   • On login, a `sid` (opaque random token) is generated, embedded in the
 *     JWT, AND persisted as a `Session` row. The `sid` is the join key.
 *   • On every authenticated request, `validateSession()` checks the Session
 *     row exists, is not revoked, and has not expired. A revoked session is
 *     treated as unauthenticated — the client is forced to re-login.
 *   • On logout, the Session row is revoked (`revokedAt = now`). The JWT
 *     signature is still valid, but `validateSession()` rejects it.
 *   • "Logout everywhere" revokes every session for a user (password change,
 *     role demotion, account suspension).
 *   • Expired sessions are cleaned up lazily by `validateSession()` and
 *     periodically by a sweep (TBD — a cron or a boot hook).
 *
 * @see docs/backend/security.md — Session revocation, device tracking.
 */

import { prisma } from "@backend/database/db";
import { logger } from "@backend/logging/logger";
import { randomToken } from "@backend/auth/auth";
import type { AdminSession } from "@backend/auth/auth";

/** Default session TTL (8 hours) in seconds. */
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

/** "Remember me" session TTL (30 days) in seconds. */
const REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Create a new session row for a user. Called on successful login (after
 * password verification, before setting the cookie). Returns the opaque
 * session token (`sid`) to embed in the JWT.
 *
 * @param userId   The user's id.
 * @param ip        The request IP (for the device list / audit).
 * @param userAgent The User-Agent header (for the device list).
 * @param remember  Whether this is a "remember me" session (longer TTL).
 * @returns The opaque session token (`sid`) for the JWT `sid` claim.
 */
export async function createSession(
    userId: string,
    ip: string,
    userAgent: string,
    remember: boolean,
): Promise<string> {
    const token = randomToken();
    const ttlSeconds = remember ? REMEMBER_TTL_SECONDS : DEFAULT_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await prisma.session.create({
        data: {
            token,
            userId,
            ip: ip ?? "",
            userAgent: userAgent ?? "",
            rememberMe: remember,
            expiresAt,
        },
    });

    logger.debug(
        { userId, sid: token.slice(0, 8) + "…", remember },
        "session.created",
    );
    return token;
}

/**
 * Validate a session token against the database. Returns `true` if the
 * session exists, is not revoked, and has not expired. Called on every
 * authenticated request (after the JWT signature check) so a revoked session
 * is immediately rejected.
 *
 * Also updates `lastUsedAt` (heartbeat) and lazily cleans up expired sessions.
 *
 * @param sid The opaque session token from the JWT `sid` claim.
 * @returns `true` if the session is valid and active.
 */
export async function validateSession(sid: string): Promise<boolean> {
    if (!sid) return false;

    const session = await prisma.session.findUnique({
        where: { token: sid },
        select: { id: true, revokedAt: true, expiresAt: true },
    });

    if (!session) return false;
    if (session.revokedAt !== null) return false;
    if (session.expiresAt < new Date()) {
        // Lazily clean up expired sessions.
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {
            /* already deleted — ignore */
        });
        return false;
    }

    // Heartbeat: update lastUsedAt (fire-and-forget, non-blocking).
    void prisma.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch((err: unknown) =>
            logger.warn({ err }, "session.heartbeat_failed"),
        );

    return true;
}

/**
 * Revoke a single session (per-device logout). The JWT signature remains
 * valid, but `validateSession()` will reject it on the next request.
 *
 * @param sid The opaque session token to revoke.
 */
export async function revokeSession(sid: string): Promise<void> {
    await prisma.session
        .updateMany({
            where: { token: sid, revokedAt: null },
            data: { revokedAt: new Date() },
        })
        .catch((err: unknown) => logger.warn({ err }, "session.revoke_failed"));
    logger.debug({ sid: sid.slice(0, 8) + "…" }, "session.revoked");
}

/**
 * Revoke every active session for a user (force logout everywhere). Used on
 * password change, role demotion, account suspension, and "logout all
 * devices" from the security settings.
 *
 * @param userId The user whose sessions should be revoked.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
    const result = await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
    logger.debug({ userId, count: result.count }, "session.revoked_all");
}

/**
 * List all active (non-revoked, non-expired) sessions for a user. Used by
 * the device-management UI so the user can see and revoke individual devices.
 *
 * @param userId The user's id.
 * @returns Active sessions with device info (IP, user agent, last used).
 */
export async function listActiveSessions(userId: string): Promise<
    {
        id: string;
        token: string;
        ip: string;
        userAgent: string;
        rememberMe: boolean;
        lastUsedAt: Date;
        createdAt: Date;
        expiresAt: Date;
    }[]
> {
    const sessions = await prisma.session.findMany({
        where: {
            userId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        select: {
            id: true,
            token: true,
            ip: true,
            userAgent: true,
            rememberMe: true,
            lastUsedAt: true,
            createdAt: true,
            expiresAt: true,
        },
        orderBy: { lastUsedAt: "desc" },
    });
    return sessions;
}

/**
 * Revoke all sessions except the current one. Used by "logout other devices"
 * in the security settings — the current device stays logged in.
 *
 * @param userId    The user's id.
 * @param currentSid The current session token (kept active).
 */
export async function revokeOtherSessions(
    userId: string,
    currentSid: string,
): Promise<number> {
    const result = await prisma.session.updateMany({
        where: {
            userId,
            token: { not: currentSid },
            revokedAt: null,
        },
        data: { revokedAt: new Date() },
    });
    logger.debug({ userId, count: result.count }, "session.revoked_others");
    return result.count;
}

/**
 * Clean up expired sessions from the database. Called periodically (boot
 * hook or cron) to keep the sessions table from growing unbounded.
 *
 * @returns The number of sessions deleted.
 */
export async function purgeExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                {
                    revokedAt: {
                        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            ],
        },
    });
    logger.debug({ count: result.count }, "session.purged_expired");
    return result.count;
}

/**
 * Validate a decoded JWT session against the database. Convenience wrapper
 * for `validateSession()` that takes the full `AdminSession` payload.
 *
 * @param session The decoded JWT payload.
 * @returns `true` if the session is valid and active.
 */
export async function isValidSession(session: AdminSession): Promise<boolean> {
    return validateSession(session.sid);
}

export { DEFAULT_TTL_SECONDS, REMEMBER_TTL_SECONDS };
