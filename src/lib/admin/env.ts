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

export const adminEnv = {
    /** HMAC secret for signing session JWTs. */
    jwtSecret: requireSecret(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET"),
    /** Node env — drives cookie `secure` flag. */
    nodeEnv: process.env.NODE_ENV ?? "development",
    /** Default owner email — seeded on first boot if no users exist. */
    ownerEmail: process.env.ADMIN_OWNER_EMAIL ?? "admin@kandarp-os.dev",
    /** Default owner password — seeded on first boot. CHANGE IMMEDIATELY. */
    ownerPassword: process.env.ADMIN_OWNER_PASSWORD ?? "ChangeMe!2026",
    /** Absolute path to the JSON store root. Defaults to `.admin-data`. */
    dataDir: process.env.ADMIN_DATA_DIR ?? ".admin-data",
} as const;
