# Logging — Kandarp OS Backend

> Pino structured logging — the single logging entry point.
> Newline-delimited JSON for log aggregators (Loki, Datadog, ELK), pretty-printed in dev.

---

## Overview

[Pino](https://github.com/pinojs/pino) is the fastest logger in the Node ecosystem.
It emits newline-delimited JSON (NDJSON) that any log aggregator can ingest without
parsing. In development, `pino-pretty` pretty-prints for readability; in production,
compact JSON is emitted.

- **Base logger**: [`logger.ts`](../../src/lib/admin/logger.ts) — configured once per process.
- **Request context**: [`request-context.ts`](../../src/lib/admin/request-context.ts) —
  correlation ID + child logger.
- **Request lifecycle**: [`with-logging.ts`](../../src/lib/admin/with-logging.ts) —
  HOF that wraps route handlers with start/end/error logging.

---

## Log Levels

| Level   | Numeric | When to use                                                 |
| ------- | :-----: | ----------------------------------------------------------- |
| `fatal` |   60    | Process must exit (unrecoverable)                           |
| `error` |   50    | Operation failed; request could not complete                |
| `warn`  |   40    | Something unexpected happened but the request succeeded     |
| `info`  |   30    | Normal operation (login success, session created)           |
| `debug` |   20    | Detailed diagnostic info (variant generation, query params) |
| `trace` |   10    | Very detailed (internal state, loop iterations)             |

The active level is set by `LOG_LEVEL` (env var). In development, the default is
`debug`; in production, `info`.

---

## Redaction

The logger **never** logs secrets. The `REDACT_PATHS` list in `logger.ts` strips
known sensitive keys from every log object before serialization:

- **Auth**: `password`, `passwordHash`, `newPassword`, `oldPassword`, `token`,
  `refreshToken`, `accessToken`, `idToken`, `secret`, `totpSecret`, `resetToken`,
  `verifyToken`, `apiKey` (and nested `*.password`, `*.token`, etc.)
- **HTTP**: `req.headers.authorization`, `req.headers.cookie`,
  `res.headers['set-cookie']`
- **Env-shaped**: `env.DATABASE_URL`, `env.ADMIN_JWT_SECRET`,
  `env.CLOUDINARY_API_SECRET`, `env.AUTH_SECRET` (and nested variants)

Redacted values are replaced with `"[Redacted]"` so the key is still visible
(useful for debugging "why is this field empty?") but the value is gone.

---

## Correlation IDs

Every admin API request gets a unique correlation ID (`reqId`):

1. `withLogging` generates a UUID via `newRequestId()`.
2. A child logger is created with `reqId` bound: `requestLogger(reqId)`.
3. Every log line for that request includes `reqId`.
4. The `reqId` is returned in the `x-request-id` response header.

This means a user reporting a bug can quote the `x-request-id` and support can
grep the log aggregator for that `reqId` to find the full request lifecycle.

### Example Log Lines

```json
{"level":30,"time":1700000000000,"reqId":"a1b2c3d4-...","method":"POST","path":"/api/admin/auth/login","query":null,"ua":"Mozilla/5.0...","msg":"request.start"}
{"level":30,"time":1700000000123,"reqId":"a1b2c3d4-...","userId":"uuid","ip":"1.2.3.4","msg":"login.success"}
{"level":30,"time":1700000000456,"reqId":"a1b2c3d4-...","method":"POST","path":"/api/admin/auth/login","status":200,"durationMs":456,"msg":"request.end"}
```

---

## Request Lifecycle

The `withLogging` HOF wraps a route handler:

```ts
export const POST = withLogging(async (req, { log }: RouteContext) => {
    const session = await requirePermission("users:write");
    // ... handler logic ...
    log.info({ userId: session.sub }, "user.created");
    return json({ ok: true });
});
```

For each request, the wrapper:

1. Generates a `reqId` and binds it to a child logger.
2. Logs `request.start` (method, path, query, user agent — **never the body**).
3. Runs the handler, passing the logger via the `RouteContext`.
4. Logs `request.end` (status, duration in ms).
5. If the handler throws, logs `request.error` (with stack trace) and returns
   a `500` with the `reqId` (the client never sees the raw error).

### Log Level by Status

| Status    | Level   |
| --------- | ------- |
| 2xx / 3xx | `info`  |
| 4xx       | `warn`  |
| 5xx       | `error` |

---

## Security Event Logging

Security-relevant events are logged at `warn` or `error` level so they stand out
in aggregators:

| Event                               | Level   | Where                 |
| ----------------------------------- | ------- | --------------------- |
| Login — bad password                | `warn`  | login route           |
| Login — user not found              | `warn`  | login route           |
| Login — rate limited                | `warn`  | login route           |
| Login — success                     | `info`  | login route           |
| Password rehashed (scrypt→Argon2id) | `info`  | login route           |
| Session revoked                     | `debug` | session-service       |
| Sessions revoked (password change)  | `info`  | change-password route |
| Auth — no session                   | `warn`  | `api.ts`              |
| Auth — session revoked/expired      | `warn`  | `api.ts`              |
| Auth — forbidden (RBAC)             | `warn`  | `api.ts`              |
| Validation failed                   | `debug` | `api.ts`              |

---

## What is NOT Logged

- **Request bodies** — may contain passwords; never logged.
- **Response bodies** — may contain user data; never logged.
- **Cookies / authorization headers** — redacted by Pino.
- **Full session tokens** — only the first 8 chars + `…` are logged.
- **Stack traces to the client** — the `withLogging` HOF returns a generic
  `500` with a `requestId`; the full stack goes to logs only.

---

## Usage in Route Handlers

```ts
import { withLogging, type RouteContext } from "@/lib/admin/with-logging";

export const POST = withLogging(async (req, { log }: RouteContext) => {
    // Use `log` (the child logger with reqId bound) for all per-request logs.
    log.info({ userId: "..." }, "entity.created");
    log.warn({ ip: "..." }, "suspicious.activity");
    log.debug({ filters: { ... } }, "query.executed");
    return json({ ok: true });
});
```

For non-route code (services, repo), import the root logger:

```ts
import { logger } from "@/lib/admin/logger";
logger.info({ userId }, "session.created");
```
