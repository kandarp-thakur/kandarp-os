/**
 * POST /api/admin/auth/login — authenticate a user, set the session cookie.
 *
 * Validates email + password against the user store, issues a JWT, and sets
 * the HttpOnly session cookie. Rate-limited per-IP (5 attempts / 15 min) to
 * slow brute-force attacks. Logs the login to the audit trail.
 *
 * 2FA-ready: if the user has `totpEnabled`, the response asks for a second
 * step (`requiresTotp: true`) instead of issuing a session — the client then
 * POSTs `/api/admin/auth/verify-totp` with the code. Until a user enrolls
 * 2FA, login is single-step.
 */

import {
    verifyPassword,
    hashPassword,
    needsRehash,
    signTotpChallenge,
} from "@backend/auth/auth";
import { error, json } from "@backend/middlewares/api";
import { setSessionCookie, logActivity } from "@backend/auth/session";
import { createSession } from "@backend/auth/session-service";
import { findByField, update } from "@backend/repositories/repo";
import { ensureSeeded } from "@backend/services/seed";
import {
    withLogging,
    type RouteContext,
} from "@backend/middlewares/with-logging";
import type { User } from "@backend/schemas/types";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember: z.boolean().optional(),
});

/** In-memory rate limiter — { ip: [timestamps] }. Resets on server restart. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    hits.push(now);
    attempts.set(ip, hits);
    return hits.length > MAX_ATTEMPTS;
}

export const POST = withLogging(async (req, { log }: RouteContext) => {
    // Seed the store on first boot so the owner account exists.
    await ensureSeeded();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (rateLimited(ip)) {
        log.warn({ ip }, "login.rate_limited");
        return error("Too many login attempts. Try again later.", 429, 429);
    }

    const body = await loginSchema.safeParse(
        await req.json().catch(() => ({})),
    );
    if (!body.success) {
        return error("Invalid email or password.", 400);
    }

    const { email, password } = body.data;
    const user = await findByField<User>("users", "email", email.toLowerCase());
    if (!user || user.status !== "active") {
        // Log failed login — don't reveal whether the email exists (anti-enumeration).
        log.warn(
            { ip, email: email.toLowerCase() },
            "login.failed.user_not_found",
        );
        return error("Invalid email or password.", 401, 401);
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        log.warn({ ip, userId: user.id }, "login.locked");
        await logActivity({
            userId: user.id,
            userName: user.name,
            action: "user.login.locked",
            level: "warning",
            ip,
            details: "Login rejected while account lockout is active",
        });
        return error("Invalid email or password.", 401, 401);
    }

    const verified = await verifyPassword(password, user.passwordHash);
    if (!verified) {
        const failedLogins = user.failedLogins + 1;
        const lockout = failedLogins >= 5;
        await update<User>("users", user.id, {
            failedLogins: lockout ? 0 : failedLogins,
            lockedUntil: lockout
                ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                : null,
        });
        log.warn({ ip, userId: user.id }, "login.failed.bad_password");
        await logActivity({
            userId: user.id,
            userName: user.name,
            action: lockout ? "user.login.locked" : "user.login.failed",
            level: "warning",
            ip,
            details: lockout
                ? "Account locked after five failed password attempts"
                : `Failed password attempt ${failedLogins} of 5`,
        });
        return error("Invalid email or password.", 401, 401);
    }

    // Transparent rehash: upgrade legacy scrypt hashes to Argon2id on next login.
    if (needsRehash(user.passwordHash)) {
        const newHash = await hashPassword(password);
        await update<User>("users", user.id, { passwordHash: newHash });
        log.info({ userId: user.id }, "login.password_rehashed");
    }

    // 2FA gate — issue a short-lived, signed proof that the password step
    // succeeded. The verification endpoint derives the user and remember-me
    // preference from this token rather than trusting client-provided values.
    if (user.totpEnabled && user.totpSecret) {
        log.info({ userId: user.id }, "login.totp_required");
        return json({
            requiresTotp: true,
            challenge: signTotpChallenge(user.id, body.data.remember ?? false),
        });
    }

    // A successful login clears any prior lockout state.
    if (user.failedLogins || user.lockedUntil) {
        await update<User>("users", user.id, {
            failedLogins: 0,
            lockedUntil: null,
        });
    }

    // Persist the session to the database for revocation + device tracking.
    const userAgent = req.headers.get("user-agent") ?? "";
    const sid = await createSession(
        user.id,
        ip,
        userAgent,
        body.data.remember ?? false,
    );

    await setSessionCookie(
        {
            sub: user.id,
            sid,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        body.data.remember ?? false,
    );

    await update<User>("users", user.id, {
        lastLoginAt: new Date().toISOString(),
    });
    await logActivity({
        userId: user.id,
        userName: user.name,
        action: "user.login",
        level: "success",
        ip,
    });

    log.info({ userId: user.id, ip }, "login.success");

    return json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});
