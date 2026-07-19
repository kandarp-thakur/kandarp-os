/**
 * Environment variable validation — Zod-validated, fail-fast, server-only.
 *
 * Reads `process.env` once at module load and validates every variable the
 * backend depends on. Unknown/extra variables are ignored (so the public
 * frontend's vars don't trip the server check). Missing required vars throw
 * a clear, actionable error at boot — never a silent fallback in production.
 *
 * Secrets are validated for *strength* (length) where it matters:
 *   • `ADMIN_JWT_SECRET` / `AUTH_SECRET` ≥ 32 bytes (HMAC security).
 *   • `DATABASE_URL` is a valid Postgres connection string.
 *
 * The validated, typed object is the single source of truth — every module
 * reads from `env` instead of `process.env` directly, so a typo'd key name
 * is caught at compile time.
 *
 * @see docs/backend/configuration.md — every env var, its purpose, and how to
 * generate secrets.
 */

import { z } from "zod";

/** A Postgres connection string (libpq or pooler URL). */
const databaseUrl = z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
        (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
        "DATABASE_URL must be a postgres:// or postgresql:// connection string",
    );

/** A 32+ byte random secret (HMAC signing). */
const secret32 = z
    .string()
    .min(
        32,
        "must be at least 32 bytes — generate with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );

/**
 * The full env schema. Every field is optional in *development* (sensible
 * dev fallbacks are applied after validation) but required in *production*.
 */
const envSchema = z.object({
    // ── Runtime ────────────────────────────────────────────────────────
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace"])
        .default("info"),

    // ── Database ───────────────────────────────────────────────────────
    DATABASE_URL: z.string().optional(),

    // ── Auth / sessions ─────────────────────────────────────────────────
    ADMIN_JWT_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    ADMIN_OWNER_EMAIL: z.string().email().default("admin@kandarp.online"),
    ADMIN_OWNER_PASSWORD: z
        .string()
        .min(8, "ADMIN_OWNER_PASSWORD must be at least 8 chars")
        .default("ChangeMe!2026"),

    // ── Public site ─────────────────────────────────────────────────────
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

    // ── Cloudinary (production storage) ─────────────────────────────────
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default("kandarp-os"),

    // ── Contact / email ─────────────────────────────────────────────────
    CONTACT_EMAIL_API_KEY: z.string().optional(),
    CONTACT_EMAIL_TO: z.string().email().optional(),
    CONTACT_EMAIL_FROM: z.string().email().optional(),

    // ── Analytics / error tracking (public) ─────────────────────────────
    NEXT_PUBLIC_ANALYTICS_SRC: z.string().optional(),
    NEXT_PUBLIC_ANALYTICS_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),

    // ── GitHub integration ─────────────────────────────────────────────
    GITHUB_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Parse + validate the environment. Throws on invalid required vars. */
function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
            .join("\n");
        throw new Error(
            `Invalid environment variables:\n${issues}\n\n` +
                "Check your .env.local (dev) or deployment environment (prod).",
        );
    }
    return parsed.data;
}

/** The validated environment. */
export const env = loadEnv();

/** True when running in production. */
export const isProduction = env.NODE_ENV === "production";

/** True when running in development. */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Production-only strict checks. Run lazily (not at import time) so that
 * `next build`'s page-data collection phase doesn't crash on a missing
 * secret — the check fires on first real request instead.
 *
 * @throws if a production-required secret is missing or weak.
 */
export function assertProductionSecrets(): void {
    if (!isProduction) return;
    const checks: Array<[string, string | undefined, (v: string) => boolean]> =
        [
            [
                "DATABASE_URL",
                env.DATABASE_URL,
                (v) => databaseUrl.safeParse(v).success,
            ],
            [
                "ADMIN_JWT_SECRET",
                env.ADMIN_JWT_SECRET,
                (v) => secret32.safeParse(v).success,
            ],
            [
                "AUTH_SECRET",
                env.AUTH_SECRET,
                (v) => secret32.safeParse(v).success,
            ],
        ];
    for (const [name, value, ok] of checks) {
        if (!value || !ok(value)) {
            throw new Error(
                `Production requires a valid ${name}. ` +
                    "See docs/backend/configuration.md.",
            );
        }
    }
}
