/**
 * Admin authentication core — Argon2id password hashing + JWT + session.
 *
 * Server-only. Uses the native `argon2` binding (Argon2id — the OWASP
 * recommended variant, resistant to both GPU and side-channel attacks) for
 * password hashing and Node's built-in `crypto` (HMAC-SHA256) for stateless
 * JWT signing.
 *
 * Security model:
 *   • Passwords hashed with Argon2id (m=64 MiB, t=3, p=4) — OWASP 2023
 *     recommended parameters. The encoded hash embeds the salt + params so
 *     verification is self-describing.
 *   • Legacy scrypt hashes (`scrypt$…$…`) are still VERIFIED so existing
 *     users can log in after the migration; on a successful legacy login the
 *     password is transparently re-hashed to Argon2id (zero-downtime upgrade).
 *   • Sessions are stateless JWTs signed with HMAC-SHA256, stored in an
 *     HttpOnly, Secure, SameSite=Lax cookie. The edge middleware verifies
 *     the same signature with Web Crypto.
 *   • Tokens carry `sub` (user id), `sid` (session id), `role`, `email`,
 *     `name`, `iat`, `exp`.
 *
 * @see docs/backend/security.md — Argon2id params, JWT, CSRF, rate limiting.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import argon2 from "argon2";

import { adminEnv } from "@backend/config/env";
import { logger } from "@backend/logging/logger";

/** A user's role — drives every authorization decision. */
export type AdminRole = "owner" | "admin" | "editor" | "viewer";

/** The decoded JWT payload. */
export interface AdminSession {
    /** User id. */
    sub: string;
    /** Session id (links to a Session row for revocation / device list). */
    sid: string;
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

/** Default session lifetime — 8 hours (sensitive admin console). */
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;
/** "Remember me" session lifetime — 30 days. */
const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30;

/* ── Argon2id parameters (OWASP 2023 recommended) ──────────────────────── */

/**
 * Argon2id options. OWASP recommends:
 *   • m (memory)  ≥ 19 MiB (we use 64 MiB for stronger protection)
 *   • t (iterations) ≥ 2 (we use 3)
 *   • p (parallelism) = 1 (we use 4 to use more cores)
 * These are tuned for a single-tenant admin console on a modern server. The
 * encoded hash stores these params, so they can be raised later without
 * breaking existing hashes (re-hash on next login).
 */
const ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 64 * 1024, // 64 MiB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
};

/* ── Password hashing (Argon2id) ───────────────────────────────────────── */

/**
 * Hash a plaintext password with Argon2id + a random salt.
 * Returns the standard Argon2 encoded string (`$argon2id$v=19$m=…,t=…,p=…$…$…`)
 * which embeds the salt + parameters — verification is self-describing.
 */
export async function hashPassword(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, ARGON2_OPTIONS);
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * Supports both:
 *   • Argon2id encoded hashes (the new standard).
 *   • Legacy `scrypt$<saltHex>$<hashHex>` hashes (transparent upgrade path).
 *
 * Constant-time comparison is used for the legacy scrypt path; argon2's
 * native verify is already constant-time.
 *
 * @returns `"argon2" | "scrypt" | null` — the algorithm that matched, or null
 *   on failure. Callers re-hash to Argon2id when the result is `"scrypt"`.
 */
export async function verifyPassword(
    plaintext: string,
    stored: string,
): Promise<"argon2" | "scrypt" | null> {
    // New Argon2id hashes.
    if (stored.startsWith("$argon2")) {
        try {
            const ok = await argon2.verify(stored, plaintext);
            return ok ? "argon2" : null;
        } catch (err) {
            logger.warn({ err }, "Argon2 verify threw — treating as mismatch");
            return null;
        }
    }
    // Legacy scrypt hashes (`scrypt$<saltHex>$<hashHex>`).
    if (stored.startsWith("scrypt$")) {
        const ok = verifyScryptLegacy(plaintext, stored);
        return ok ? "scrypt" : null;
    }
    return null;
}

/** Verify a legacy `scrypt$…$…` hash (constant-time). */
function verifyScryptLegacy(plaintext: string, stored: string): boolean {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1] ?? "", "hex");
    const expected = Buffer.from(parts[2] ?? "", "hex");
    const hash = scryptSync(plaintext, salt, 64, { N: 16384, r: 8, p: 1 });
    if (hash.length !== expected.length) return false;
    return timingSafeEqual(hash, expected);
}

/** Does `stored` need re-hashing to the current Argon2id standard? */
export function needsRehash(stored: string): boolean {
    return !stored.startsWith("$argon2id$");
}

/* ── JWT (HMAC-SHA256) ──────────────────────────────────────────────────── */

function sign(data: string): string {
    return createHmac("sha256", adminEnv.jwtSecret).update(data).digest("hex");
}

/** Base64url-encode without padding (JWT spec). */
function b64url(input: Buffer | string): string {
    return Buffer.from(input).toString("base64url");
}

/**
 * Sign a session payload into a compact JWT.
 * @param ttlSeconds token lifetime (8h default, 30d for "remember me").
 */
export function signSession(
    payload: Omit<AdminSession, "iat" | "exp">,
    ttlSeconds = DEFAULT_SESSION_TTL_SECONDS,
): string {
    const now = Math.floor(Date.now() / 1000);
    const full: AdminSession = {
        ...payload,
        iat: now,
        exp: now + ttlSeconds,
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

/** Session TTL constants — exported for the session service. */
export const SESSION_TTL = {
    default: DEFAULT_SESSION_TTL_SECONDS,
    rememberMe: REMEMBER_ME_TTL_SECONDS,
} as const;

/** Cookie attributes for the session JWT — secure-by-default. */
export function sessionCookieOptions(maxAge = DEFAULT_SESSION_TTL_SECONDS) {
    return {
        httpOnly: true,
        secure: adminEnv.nodeEnv === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge,
    };
}

/** Generate a cryptographically random opaque token (session/refresh ids). */
export function randomToken(bytes = 32): string {
    return randomBytes(bytes).toString("hex");
}
