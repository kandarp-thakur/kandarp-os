/**
 * Admin middleware — authentication gate + layout isolation.
 *
 * Runs on every request under `/admin` and `/api/admin`. It:
 *   1. Verifies the session JWT from the cookie (Web Crypto — edge-compatible).
 *   2. Redirects unauthenticated page requests to `/admin/login`.
 *   3. Returns 401 for unauthenticated API requests.
 *   4. Sets `x-is-admin: 1` on admin requests so the root layout can skip the
 *      public navbar/footer/3D-background (the admin has its own chrome).
 *
 * The login page + the login API endpoint are public (no session required).
 * Rate limiting is applied at the route-handler level (login) — middleware
 * stays thin and edge-fast.
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

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only guard the admin namespaces.
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminApi = pathname.startsWith("/api/admin");
    if (!isAdminPage && !isAdminApi) return NextResponse.next();

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
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized", code: 401 }),
                {
                    status: 401,
                    headers: { "content-type": "application/json" },
                },
            );
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
