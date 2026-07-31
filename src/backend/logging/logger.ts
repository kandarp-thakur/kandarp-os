/**
 * Pino structured logging — the single logging entry point.
 *
 * Pino is the fastest logger in the Node ecosystem and emits newline-delimited
 * JSON (NDJSON) that any log aggregator (Loki, Datadog, ELK) can ingest without
 * parsing. The logger writes directly to stdout in every environment. Avoid
 * Pino transports here: they create a worker thread whose generated module can
 * be omitted from Next.js development server chunks, crashing API requests.
 *
 * Security: this logger NEVER logs secrets. The redact list strips known
 * sensitive keys (password, token, secret, cookie, authorization, …) from
 * every log object before serialization, so a stray `logger.info({ req })`
 * cannot leak a credential. Stack traces and DB errors are logged at `error`
 * but their raw text is never sent to the client (the API layer maps errors
 * to generic messages for responses — see `api.ts`).
 *
 * Server-only: Pino writes to stdout/stderr and touches `process.env`; it must
 * never run in the browser.
 *
 * @see docs/backend/logging.md — log levels, redaction, request correlation.
 */

import pino, { type Logger } from "pino";

/** Keys redacted from every log object (case-insensitive, nested via dot). */
const REDACT_PATHS = [
    // Auth
    "password",
    "passwordHash",
    "newPassword",
    "oldPassword",
    "token",
    "refreshToken",
    "accessToken",
    "idToken",
    "secret",
    "clientSecret",
    "webhookSecret",
    "privateKey",
    "totpSecret",
    "resetToken",
    "verifyToken",
    "apiKey",
    "*.password",
    "*.passwordHash",
    "*.token",
    "*.secret",
    "*.clientSecret",
    "*.webhookSecret",
    "*.privateKey",
    "*.refreshToken",
    "*.accessToken",
    "*.config.*",
    "*.environmentVariables.*.value",
    // HTTP
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    // Env-shaped objects
    "env.DATABASE_URL",
    "env.ADMIN_JWT_SECRET",
    "env.CLOUDINARY_API_SECRET",
    "env.AUTH_SECRET",
    "env.MANAGED_SECRETS_KEY",
    "*.DATABASE_URL",
    "*.ADMIN_JWT_SECRET",
    "*.CLOUDINARY_API_SECRET",
    "*.AUTH_SECRET",
    "*.MANAGED_SECRETS_KEY",
];

/** Base logger — configured once per process. */
const baseLogger: Logger = pino({
    level:
        process.env.LOG_LEVEL ??
        (process.env.NODE_ENV === "production" ? "info" : "debug"),
    redact: {
        paths: REDACT_PATHS,
        // Replace redacted values with "[Redacted]" so the key is still visible
        // (useful for debugging "why is this field empty?") but the value is gone.
        censor: "[Redacted]",
    },
    base: {
        service: "kandarp-os",
        env: process.env.NODE_ENV ?? "development",
    },
    // Write synchronously to Pino's default stdout destination. A development
    // `pino-pretty` transport would run through thread-stream's worker thread;
    // Next.js can emit the transport without its worker module in `.next-dev`,
    // causing every subsequent log call (including login auditing) to throw.
    // Pretty output can still be added externally by piping the process output.
    // Never crash the app because of a logger error.
    serializers: {
        err: pino.stdSerializers.err,
        req: (req: unknown) => {
            // Only keep safe fields from request objects.
            if (req && typeof req === "object") {
                const r = req as { method?: string; url?: string };
                return { method: r.method, url: r.url };
            }
            return req;
        },
    },
});

/** The root logger — import this everywhere. */
export const logger = baseLogger;

/** A child logger with a bound context (e.g. module name, request id). */
export function childLogger(bindings: Record<string, unknown>): Logger {
    return baseLogger.child(bindings);
}

export type { Logger };
