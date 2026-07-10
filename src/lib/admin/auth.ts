/**
 * Admin authentication core — password hashing + JWT + session.
 *
 * Server-only. Uses Node's built-in `crypto` (scrypt for password hashing,
 * HMAC-SHA256 for JWT signing) so the admin needs zero new dependencies.
 *
 * Security model:
 *   • Passwords hashed with scrypt (N=16384, r=8, p=1) + 16-byte salt.
 *   • Sessions are stateless JWTs signed with HMAC-SHA256, stored in an
 *     HttpOnly, Secure, SameSite=Lax cookie.
 *   • Tokens carry `sub` (user id), `role`, and `exp` (30d default).
 *   • 2FA-ready: the user model carries an optional `totpSecret`; verification
 *     is a separate step wired into the login flow but not enforced until a
 *     secret is set (so the console is usable immediately).
 *
 * @see docs/security — JWT, CSRF, rate limiting, secure cookies, RBAC, audit.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { adminEnv } from "@/lib/admin/env";

/** A user's role — drives every authorization decision. */
export type AdminRole = "owner" | "admin" | "editor" | "viewer";

/** The decoded JWT payload. */
export interface AdminSession {
    /** User id. */
    sub: string;
    /** User email. */
    email: string;
    /** Display name. */
    name: string;
    /** Authorization role. */
    role: AdminRole;
    /** Issued-at (unix seconds). */
    iat: number;
    /** Expiry (unix seconds). */
    exp: number;
}

/** The cookie name that carries the session JWT. */
export const SESSION_COOKIE = "kos_admin_session";

/** Session lifetime — 30 days. */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/* ── Password hashing (scrypt) ─────────────────────────────────────────── */

/**
 * Hash a plaintext password with scrypt + a random 16-byte salt.
 * Returns `scrypt$<saltHex>$<hashHex>` — a self-describing string.
 */
export function hashPassword(plaintext: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(plaintext, salt, 64, {
        N: 16384,
        r: 8,
        p: 1,
    });
    return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored `scrypt$…$…` hash.
 * Constant-time comparison via `timingSafeEqual`.
 */
export function verifyPassword(plaintext: string, stored: string): boolean {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1] ?? "", "hex");
    const expected = Buffer.from(parts[2] ?? "", "hex");
    const hash = scryptSync(plaintext, salt, 64, { N: 16384, r: 8, p: 1 });
    if (hash.length !== expected.length) return false;
    return timingSafeEqual(hash, expected);
}

/* ── JWT (HMAC-SHA256) ──────────────────────────────────────────────────── */

function sign(data: string): string {
    return createHmac("sha256", adminEnv.jwtSecret).update(data).digest("hex");
}

/** Base64url-encode without padding (JWT spec). */
function b64url(input: Buffer | string): string {
    return Buffer.from(input).toString("base64url");
}

/** Sign a session payload into a compact JWT. */
export function signSession(
    payload: Omit<AdminSession, "iat" | "exp">,
): string {
    const now = Math.floor(Date.now() / 1000);
    const full: AdminSession = {
        ...payload,
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
    };
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = b64url(JSON.stringify(full));
    const signature = sign(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
}

/**
 * Verify a JWT's signature + expiry. Returns the decoded session or `null`.
 * Constant-time signature comparison.
 */
export function verifySession(token: string): AdminSession | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts as [string, string, string];
    const expected = sign(`${header}.${body}`);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        return null;
    }
    try {
        const payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8"),
        ) as AdminSession;
        if (typeof payload.exp !== "number") return null;
        if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

/* ── Cookie options ─────────────────────────────────────────────────────── */

/** Cookie attributes for the session JWT — secure-by-default. */
export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
    return {
        httpOnly: true,
        secure: adminEnv.nodeEnv === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge,
    };
}
