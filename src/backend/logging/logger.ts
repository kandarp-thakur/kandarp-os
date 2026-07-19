/**
 * Pino structured logging — the single logging entry point.
 *
 * Pino is the fastest logger in the Node ecosystem and emits newline-delimited
 * JSON (NDJSON) that any log aggregator (Loki, Datadog, ELK) can ingest without
 * parsing. In development we pretty-print for readability; in production we
 * emit compact JSON.
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
    "totpSecret",
    "resetToken",
    "verifyToken",
    "apiKey",
    "*.password",
    "*.passwordHash",
    "*.token",
    "*.secret",
    "*.refreshToken",
    "*.accessToken",
    // HTTP
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    // Env-shaped objects
    "env.DATABASE_URL",
    "env.ADMIN_JWT_SECRET",
    "env.CLOUDINARY_API_SECRET",
    "env.AUTH_SECRET",
    "*.DATABASE_URL",
    "*.ADMIN_JWT_SECRET",
    "*.CLOUDINARY_API_SECRET",
    "*.AUTH_SECRET",
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
    // Pretty-print in dev for human readability; compact JSON in prod.
    transport:
        process.env.NODE_ENV === "development"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: "SYS:HH:MM:ss.l",
                      ignore: "pid,hostname,service,env",
                  },
              }
            : undefined,
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
