/**
 * Admin middleware — authentication gate + security controls + layout isolation.
 *
 * Runs on every request under `/admin` and `/api/admin`. It:
 *   1. Verifies the session JWT from the cookie (Web Crypto — edge-compatible).
 *   2. Redirects unauthenticated page requests to `/admin/login`.
 *   3. Returns 401 for unauthenticated API requests.
 *   4. Sets `x-is-admin: 1` on admin requests so the root layout can skip the
 *      public navbar/footer/3D-background (the admin has its own chrome).
 *
 * Security controls (admin API routes only):
 *   • Rate limiting — in-memory sliding-window limiter per IP. Protects
 *     against brute-force and abuse. Resets on server restart (acceptable for
 *     a single-instance admin; for multi-instance, upgrade to Redis).
 *   • CSRF origin check — state-changing requests (POST/PUT/PATCH/DELETE)
 *     must originate from the same site (Origin/Referer header matches the
 *     request host). Blocks cross-site form submissions even when the cookie
 *     is `SameSite=Lax` (Lax allows top-level GET navigations).
 *   • Request body size limit — rejects oversized payloads early (before the
 *     route handler reads the body) to prevent memory-exhaustion DoS. The
 *     media upload route (10 MB) is exempt; all other admin APIs cap at 1 MB.
 *
 * Static security headers (HSTS, CSP, nosniff, frame-options, etc.) are set
 * in `next.config.mjs` `headers()` so they apply to every route with zero
 * per-request overhead.
 *
 * Note: middleware runs on the Edge runtime, so it cannot use Node's `crypto`
 * module. JWT verification here uses Web Crypto (`SubtleCrypto`) via a small
 * HMAC-SHA256 helper. The full Node-based verifier lives in `auth.ts` for
 * route handlers (which run on Node).
 */

import { NextResponse, type NextRequest } from "next/server";

/** Cookie name — kept in sync with `auth.ts`. */
const SESSION_COOKIE = "kos_admin_session";

/** Paths that are public even within the admin namespace. */
const PUBLIC_PATHS = [
    "/admin/login",
    "/api/admin/auth/login",
    "/api/admin/auth/forgot",
];

/** Public paths that are only open for specific HTTP methods. */
const PUBLIC_METHOD_PATHS: Record<string, string[]> = {
    "/api/admin/analytics": ["POST"],
};

function isPublic(pathname: string, method: string): boolean {
    if (
        PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) {
        return true;
    }
    const methods = PUBLIC_METHOD_PATHS[pathname];
    if (methods && methods.includes(method)) return true;
    return false;
}

// ── Rate limiting ──────────────────────────────────────────────────────────

/**
 * In-memory sliding-window rate limiter.
 *
 * Each IP gets a bucket of timestamps. On every request we prune entries
 * older than the window, add the current timestamp, and reject if the count
 * exceeds the limit. Buckets are lazily garbage-collected (stale IPs are
 * evicted when the map grows past a threshold) to bound memory in long-running
 * processes.
 *
 * Limits are intentionally generous for authenticated admin use but tight
 * enough to stop brute-force and scraping. The login route has its own
 * stricter limiter (5 / 15 min) at the handler level.
 */

interface RateBucket {
    hits: number[];
    /** First-hit timestamp — used for lazy eviction. */
    firstSeen: number;
}

const rateBuckets = new Map<string, RateBucket>();
/** Max buckets before we evict stale ones (bounds memory). */
const MAX_BUCKETS = 10_000;

/** General admin API limit: 120 requests / 60 seconds per IP. */
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 120;

/** Periodic eviction of stale buckets to bound memory. */
function evictStaleBuckets(now: number): void {
    if (rateBuckets.size < MAX_BUCKETS) return;
    for (const [ip, bucket] of rateBuckets) {
        const recent = bucket.hits.filter((t) => now - t < RATE_WINDOW_MS);
        if (recent.length === 0) {
            rateBuckets.delete(ip);
        } else {
            bucket.hits = recent;
        }
    }
}

/**
 * Returns true if the IP has exceeded the rate limit. Mutates the bucket
 * (records the hit).
 */
function rateLimited(ip: string): boolean {
    const now = Date.now();
    evictStaleBuckets(now);

    const bucket = rateBuckets.get(ip);
    if (!bucket) {
        rateBuckets.set(ip, { hits: [now], firstSeen: now });
        return false;
    }

    // Prune hits outside the window.
    bucket.hits = bucket.hits.filter((t) => now - t < RATE_WINDOW_MS);
    bucket.hits.push(now);
    return bucket.hits.length > RATE_MAX;
}

/** Extract the client IP from the request (first proxy hop). */
function clientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

// ── CSRF origin check ──────────────────────────────────────────────────────

/**
 * CSRF protection via Origin/Referer validation.
 *
 * For state-changing requests (POST, PUT, PATCH, DELETE) we verify that the
 * request's `Origin` (or `Referer` fallback) matches the server's host. This
 * blocks cross-site form submissions: an attacker on `evil.com` can't forge
 * a POST to `/api/admin/users` because the browser will send
 * `Origin: https://evil.com` which doesn't match.
 *
 * This complements the `SameSite=Lax` cookie: Lax blocks cross-site POSTs
 * from *simple* forms but allows top-level GET navigations and some
 * cross-site fetches. The Origin check closes the gap for state-changing
 * API calls.
 *
 * GET/HEAD/OPTIONS are exempt (they must be safe + idempotent by HTTP spec;
 * if a route mutates state on GET that's a separate bug).
 */
function isStateChanging(method: string): boolean {
    const m = method.toUpperCase();
    return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

/**
 * Returns true if the request passes the CSRF origin check (or if the check
 * is not applicable). Returns false if the origin is present but doesn't
 * match the server host.
 */
function csrfOk(req: NextRequest): boolean {
    if (!isStateChanging(req.method)) return true;

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const source = origin ?? referer;

    // If neither header is present, allow it. Browsers always send Origin
    // for cross-site fetches and same-site POSTs; a missing origin is likely
    // a non-browser client (curl, Postman) or a same-origin form. The auth
    // layer (requireAuth) still gates access, so this is safe.
    if (!source) return true;

    let sourceHost: string;
    try {
        sourceHost = new URL(source).host;
    } catch {
        // Malformed origin/referer — reject to be safe.
        return false;
    }

    // The request host is the authoritative server host.
    const serverHost = req.headers.get("host");
    if (!serverHost) return true; // Can't verify — don't block (proxy edge case).

    return sourceHost === serverHost;
}

// ── Request body size limit ─────────────────────────────────────────────────

/**
 * Maximum request body size for admin API routes.
 *
 * Rejects requests with a `Content-Length` exceeding the limit before the
 * route handler reads the body — preventing memory-exhaustion DoS. The media
 * upload route allows 10 MB files, so it's exempt from this check (the route
 * handler enforces its own limit).
 */

/** 1 MB for general admin API requests. */
const MAX_BODY_BYTES = 1 * 1024 * 1024;
/** 12 MB for media upload (handler enforces 10 MB on the file itself). */
const MAX_UPLOAD_BODY_BYTES = 12 * 1024 * 1024;

/** Paths exempt from the general body-size limit (have their own limits). */
const UPLOAD_PATHS = ["/api/admin/media/upload"];

function isUploadPath(pathname: string): boolean {
    return UPLOAD_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

/**
 * Returns true if the request body is within the allowed size. Returns true
 * if no `Content-Length` is present (chunked/streaming — the route handler is
 * responsible for enforcing limits in that case).
 */
function bodySizeOk(req: NextRequest, pathname: string): boolean {
    const cl = req.headers.get("content-length");
    if (!cl) return true;
    const size = Number.parseInt(cl, 10);
    if (Number.isNaN(size)) return true;
    const limit = isUploadPath(pathname)
        ? MAX_UPLOAD_BODY_BYTES
        : MAX_BODY_BYTES;
    return size <= limit;
}

// ── JWT verification (Web Crypto) ────────────────────────────────────────────

/** Verify a JWT with Web Crypto (edge-compatible). Returns true if valid. */
async function verifyOnEdge(token: string, secret: string): Promise<boolean> {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        const [header, body, signature] = parts as [string, string, string];

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"],
        );
        const data = new TextEncoder().encode(`${header}.${body}`);

        // The Node-side signer (auth.ts) produces a hex-encoded signature.
        // Web Crypto expects raw bytes, so we convert the hex string to a
        // Uint8Array before verifying.
        const sigHex = signature;
        const sigBytes = new Uint8Array(sigHex.length / 2);
        for (let i = 0; i < sigBytes.length; i++) {
            sigBytes[i] = parseInt(sigHex.slice(i * 2, i * 2 + 2), 16);
        }

        const ok = await crypto.subtle.verify("HMAC", key, sigBytes, data);
        if (!ok) return false;

        // Check expiry.
        const payload = JSON.parse(
            new TextDecoder().decode(base64urlToBuffer(body)),
        ) as { exp?: number };
        if (typeof payload.exp !== "number") return false;
        return Math.floor(Date.now() / 1000) < payload.exp;
    } catch {
        return false;
    }
}

function base64urlToBuffer(s: string): ArrayBuffer {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a JSON error response with security headers. */
function jsonError(message: string, status: number): NextResponse {
    return new NextResponse(JSON.stringify({ error: message, code: status }), {
        status,
        headers: {
            "content-type": "application/json",
            "x-is-admin": "1",
        },
    });
}

// ── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only guard the admin namespaces.
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminApi = pathname.startsWith("/api/admin");
    if (!isAdminPage && !isAdminApi) return NextResponse.next();

    // ── Security controls (admin API only) ────────────────────────────────
    if (isAdminApi) {
        // Rate limiting — applies to all admin API requests (public + authed).
        const ip = clientIp(req);
        if (rateLimited(ip)) {
            return jsonError("Too many requests. Please slow down.", 429);
        }

        // CSRF origin check — state-changing requests must be same-origin.
        if (!csrfOk(req)) {
            return jsonError("Cross-site request blocked (CSRF).", 403);
        }

        // Request body size limit — reject oversized payloads early.
        if (!bodySizeOk(req, pathname)) {
            return jsonError("Request body too large.", 413);
        }
    }

    // Public admin paths pass through (but still get the layout header).
    if (isPublic(pathname, req.method)) {
        const res = NextResponse.next();
        res.headers.set("x-is-admin", "1");
        return res;
    }

    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const secret =
        process.env.ADMIN_JWT_SECRET ??
        "dev-only-insecure-jwt-secret-please-override-in-prod-32b";

    const valid = token ? await verifyOnEdge(token, secret) : false;

    if (!valid) {
        if (isAdminApi) {
            return jsonError("Unauthorized", 401);
        }
        // Redirect to login, preserving the intended destination.
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/admin/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated — pass through with the layout-isolation header.
    const res = NextResponse.next();
    res.headers.set("x-is-admin", "1");
    return res;
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
