/**
 * Server-side session helpers — read/write the session cookie + log activity.
 *
 * These wrap the raw auth primitives with the Next.js request/response
 * objects so route handlers and server actions can get the current user in
 * one call. Every mutating API route logs an audit entry via `logActivity`.
 */

import { cookies } from "next/headers";

import {
    SESSION_COOKIE,
    sessionCookieOptions,
    signSession,
    verifySession,
} from "@backend/auth/auth";
import type { AdminSession, AdminRole } from "@backend/auth/auth";
import { create, list } from "@backend/repositories/repo";
import type { ActivityLog } from "@backend/schemas/types";

/** Read + verify the session from the request cookie. Returns null if absent. */
export async function getSession(): Promise<AdminSession | null> {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySession(token);
}

/** Set the session cookie on the response (login / refresh). */
export async function setSessionCookie(
    payload: Omit<AdminSession, "iat" | "exp">,
): Promise<void> {
    const store = await cookies();
    const token = signSession(payload);
    store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** Clear the session cookie (logout). */
export async function clearSessionCookie(): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
}

/** The role of the current user (or null if unauthenticated). */
export async function getCurrentRole(): Promise<AdminRole | null> {
    const session = await getSession();
    return session?.role ?? null;
}

/**
 * Record an audit-log entry. Called by every mutating API route so the
 * activity-log screen has a complete trail of who did what, when.
 */
export async function logActivity(entry: {
    userId: string;
    userName: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: string;
    level?: ActivityLog["level"];
    ip?: string;
}): Promise<void> {
    await create<ActivityLog>(
        "activityLogs",
        {
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            userName: entry.userName,
            action: entry.action,
            entity: entry.entity ?? "",
            entityId: entry.entityId ?? "",
            details: entry.details ?? "",
            level: entry.level ?? "info",
            ip: entry.ip ?? "",
        } as Omit<ActivityLog, "id" | "createdAt" | "updatedAt">,
        entry.userId,
    );
}

/** Recent activity for the dashboard widget. */
export async function recentActivity(limit = 8): Promise<ActivityLog[]> {
    const rows = await list<ActivityLog>("activityLogs");
    return rows
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit);
}
