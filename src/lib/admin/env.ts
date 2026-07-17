/**
 * Admin environment configuration — typed, validated, server-only.
 *
 * Reads from `process.env` with safe fallbacks so the console boots in dev
 * without a fully populated `.env.local`. Production deployments must set
 * `ADMIN_JWT_SECRET` (a 32+ byte random string) — otherwise the server
 * refuses to start with a clear error.
 */

function requireSecret(value: string | undefined, name: string): string {
    if (!value || value.length < 32) {
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                `${name} must be set to a 32+ byte random string in production. ` +
                    "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
            );
        }
        // Dev fallback — deterministic so sessions survive restarts in dev.
        return "dev-only-insecure-jwt-secret-please-override-in-prod-32b";
    }
    return value;
}

/**
 * Admin environment configuration.
 *
 * Exposed as **getters** rather than eager field initialisers so that simply
 * importing this module (which happens during `next build`'s "Collecting page
 * data" phase for every admin API route) does NOT trigger production secret
 * validation. Validation now runs lazily on first property access — i.e. at
 * actual request time — so a missing `ADMIN_JWT_SECRET` fails the request
 * instead of crashing the entire build. The fail-fast contract is preserved
 * for real production traffic.
 */
export const adminEnv = {
    /** HMAC secret for signing session JWTs. */
    get jwtSecret(): string {
        return requireSecret(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET");
    },
    /** Node env — drives cookie `secure` flag. */
    get nodeEnv(): string {
        return process.env.NODE_ENV ?? "development";
    },
    /** Default owner email — seeded on first boot if no users exist. */
    get ownerEmail(): string {
        return process.env.ADMIN_OWNER_EMAIL ?? "admin@kandarp-os.dev";
    },
    /** Default owner password — seeded on first boot. CHANGE IMMEDIATELY. */
    get ownerPassword(): string {
        return process.env.ADMIN_OWNER_PASSWORD ?? "ChangeMe!2026";
    },
    /** Absolute path to the JSON store root. Defaults to `.admin-data`. */
    get dataDir(): string {
        return process.env.ADMIN_DATA_DIR ?? ".admin-data";
    },
} as const;
