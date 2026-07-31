/**
 * Admin environment configuration — typed, validated, server-only.
 *
 * This is the legacy `adminEnv` accessor, kept for backward compatibility with
 * `auth.ts` and `middleware.ts`. It delegates to the Zod-validated `env` from
 * `env-schema.ts` (the single source of truth) while preserving the lazy-getter
 * contract: importing this module during `next build`'s page-data collection
 * must NOT trigger production secret validation. Validation runs lazily on
 * first property access — i.e. at actual request time — so a missing
 * `ADMIN_JWT_SECRET` fails the request instead of crashing the build.
 *
 * New code should import `env` / `assertProductionSecrets` from `env-schema.ts`
 * directly.
 */

import { env, isProduction } from "@backend/config/env-schema";

/** Dev fallback secret — deterministic so sessions survive dev restarts. */
const DEV_SECRET = "dev-only-insecure-jwt-secret-please-override-in-prod-32b";

/** Resolve a secret, failing loudly in production if it's missing/weak. */
function resolveSecret(value: string | undefined): string {
    if (!isProduction) return value && value.length >= 32 ? value : DEV_SECRET;
    if (!value || value.length < 32) {
        throw new Error(
            "ADMIN_JWT_SECRET must be set to a 32+ byte random string in production. " +
                "Generate with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
        );
    }
    return value;
}

/**
 * Admin environment configuration (lazy getters).
 * @see env-schema.ts for the full validated schema.
 */
export const adminEnv = {
    /** HMAC secret for signing session JWTs. */
    get jwtSecret(): string {
        return resolveSecret(env.ADMIN_JWT_SECRET);
    },
    /** Node env — drives cookie `secure` flag. */
    get nodeEnv(): string {
        return env.NODE_ENV;
    },
    /** Default owner email — seeded on first boot if no users exist. */
    get ownerEmail(): string {
        return env.ADMIN_OWNER_EMAIL;
    },
    /** Default owner password — seeded on first boot. CHANGE IMMEDIATELY. */
    get ownerPassword(): string {
        return env.ADMIN_OWNER_PASSWORD;
    },
    /** Absolute path to the JSON store root (legacy — kept for the old store). */
    get dataDir(): string {
        return process.env.ADMIN_DATA_DIR ?? ".admin-data";
    },
} as const;
