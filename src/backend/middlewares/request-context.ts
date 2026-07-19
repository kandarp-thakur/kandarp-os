/**
 * Request context — per-request correlation ID + child logger.
 *
 * Each admin API request gets a unique correlation ID (`req.id`) that is:
 *   • Bound to every log line for that request (so you can grep a single
 *     request's full lifecycle across multiple log entries).
 *   • Returned in the `x-request-id` response header so a user reporting a
 *     bug can quote the ID and support can find the exact log lines.
 *
 * The ID is a URL-safe random string (Web Crypto `randomUUID` is available in
 * Node 18+ and the Edge runtime). We use `crypto.randomUUID()` for simplicity
 * and uniqueness — no cryptographic strength is needed for a correlation ID.
 *
 * Server-only: this module touches `process.env` via the logger and is
 * intended for Node-runtime route handlers, not Edge middleware.
 *
 * @see docs/backend/logging.md — correlation IDs, request lifecycle logging.
 */

import { logger, childLogger, type Logger } from "@backend/logging/logger";

/** Header name for the correlation ID (returned on every API response). */
export const REQUEST_ID_HEADER = "x-request-id";

/** Generate a fresh correlation ID. */
export function newRequestId(): string {
    // crypto.randomUUID() is available in Node 18+ (Next.js 15 requires 18.17+).
    return crypto.randomUUID();
}

/**
 * Create a child logger bound to a request's correlation ID.
 *
 * Every log line emitted by this logger will include `reqId` so a single
 * request's lifecycle can be traced across multiple log entries.
 */
export function requestLogger(
    reqId: string,
    context?: Record<string, unknown>,
): Logger {
    return childLogger({ reqId, ...context });
}

export { logger };
