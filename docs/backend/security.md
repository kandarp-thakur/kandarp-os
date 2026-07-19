# Security — Kandarp OS Backend

> OWASP-aligned security controls: authentication, session management, RBAC,
> input validation, rate limiting, security headers, CSRF, secure cookies,
> audit logging, and secure error handling.

---

## Authentication

### Password Hashing

Passwords are hashed with **Argon2id** (the OWASP-recommended algorithm) via
[`auth.ts`](../../src/lib/admin/auth.ts):

- **Parameters**: `m=64MiB`, `t=3`, `p=4` (memory-hard, side-channel resistant)
- **Legacy scrypt support**: existing scrypt hashes are verified on login and
  transparently rehashed to Argon2id (zero-downtime migration)
- **`needsRehash()`**: detects legacy hashes; the login route upgrades them on
  the next successful login

### JWT

- **Algorithm**: HMAC-SHA256 (symmetric, fast, edge-compatible)
- **Edge verification**: middleware verifies the signature with Web Crypto
  (`SubtleCrypto`) — no Node `crypto` needed
- **Node verification**: route handlers use Node's `crypto` for the same JWT
- **Claims**: `sub` (user id), `sid` (session id), `email`, `name`, `role`, `exp`
- **Secret**: `ADMIN_JWT_SECRET` (≥ 32 bytes, validated in production)

### Two-Layer Session Validation

Every protected request is validated in two layers:

1. **Stateless (edge)**: middleware verifies the JWT signature — fast, no DB hit.
2. **Stateful (route)**: `requireAuth()` checks the `sid` against the `Session`
   table — a revoked session is immediately rejected.

This gives edge performance (no DB hit for signature verification) with
stateful revocation (per-device logout, force-logout-everywhere).

---

## Session Management

### Session Lifecycle

Sessions are persisted to the `Session` table for revocation and device tracking:

| Function                                  | Description                                       |
| ----------------------------------------- | ------------------------------------------------- |
| `createSession(userId, ip, ua, remember)` | Creates a session row, returns opaque `sid`       |
| `validateSession(sid)`                    | Checks exists/not revoked/not expired, heartbeats |
| `revokeSession(sid)`                      | Sets `revokedAt` (immediate invalidation)         |
| `revokeAllSessions(userId)`               | Force logout everywhere                           |
| `revokeOtherSessions(userId, currentSid)` | Logout other devices (returns count)              |
| `listActiveSessions(userId)`              | Device management UI                              |
| `purgeExpiredSessions()`                  | Cleanup                                           |

### TTLs

| Type          | TTL     |
| ------------- | ------- |
| Default       | 8 hours |
| "Remember me" | 30 days |

### Revocation Triggers

Sessions are automatically revoked when:

- **Logout**: the current session is revoked
- **Password change**: all other sessions are revoked (force re-auth on other devices)
- **Role change**: all sessions for that user are revoked (new permissions take effect)
- **Account suspension**: all sessions are revoked

### Cookie Attributes

```ts
{
    httpOnly: true,                          // No JS access (XSS can't steal)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",                         // CSRF mitigation
    path: "/",
    maxAge: <ttl>,
}
```

---

## RBAC

### Roles

| Role     | Description                                  |
| -------- | -------------------------------------------- |
| `owner`  | Full access (all permissions)                |
| `admin`  | Manage users + all content                   |
| `editor` | Create/edit all content (no user management) |
| `viewer` | Read-only access to all content              |

### Permissions

Permissions follow `<collection>:<action>` (e.g., `users:write`, `media:delete`).
The `can(role, permission)` function checks the role's permission set.
Per-user overrides can grant or revoke specific permissions.

See [`rbac.ts`](../../src/lib/admin/rbac.ts) for the full matrix.

---

## Input Validation

### Zod Schemas

Every request body is validated with a Zod schema before the handler runs:

```ts
const body = await schema.safeParse(await req.json().catch(() => ({})));
if (!body.success) return error("Validation failed: ...", 422);
```

This prevents:

- **Type confusion**: a string where a number is expected
- **Missing required fields**: a `null` where a string is required
- **Extra fields**: unknown fields are stripped (Zod default)

### Environment Validation

All env vars are validated by a Zod schema at boot
([`env-schema.ts`](../../src/lib/admin/env-schema.ts)):

- Required vars throw a clear, actionable error if missing
- Secrets are validated for strength (≥ 32 bytes)
- `DATABASE_URL` is validated as a Postgres connection string

### Path Traversal Prevention

Media upload filenames are derived from the validated MIME type — never the
user-supplied name. A malicious name like `../../evil.js` cannot control the
on-disk filename.

---

## Rate Limiting

### General Admin API (Middleware)

- **Limit**: 120 requests / 60 seconds per IP
- **Implementation**: in-memory sliding window (edge-compatible)
- **Response**: `429 { "error": "Too many requests. Please slow down." }`

### Login (Route Handler)

- **Limit**: 5 attempts / 15 minutes per IP
- **Implementation**: in-memory sliding window
- **Response**: `429 { "error": "Too many login attempts. Try again later." }`

### Memory Bounds

The rate limiter evicts stale buckets when the map exceeds 10,000 entries,
bounding memory in long-running processes.

---

## Security Headers

Static security headers are set in [`next.config.mjs`](../../next.config.mjs)
`headers()` so they apply to every route with zero per-request overhead:

| Header                      | Value                                          | Purpose                                |
| --------------------------- | ---------------------------------------------- | -------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS (HSTS)                     |
| `X-Content-Type-Options`    | `nosniff`                                      | Prevent MIME sniffing                  |
| `X-Frame-Options`           | `DENY`                                         | Clickjacking defence (legacy browsers) |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Limit referrer leakage                 |
| `Permissions-Policy`        | `camera=(), microphone=(), ...`                | Disable invasive APIs                  |
| `X-DNS-Prefetch-Control`    | `off`                                          | Disable DNS prefetch                   |
| `Content-Security-Policy`   | (see below)                                    | Restrict resource origins              |

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline';       # TODO: nonce-based
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://res.cloudinary.com;
font-src 'self' data:;
connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com;
worker-src 'self' blob:;
manifest-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;               # production only
```

The `'unsafe-inline'` for script-src is required because Next.js App Router
injects inline hydration scripts. A TODO exists to upgrade to nonce-based CSP.

---

## CSRF Protection

State-changing requests (POST, PUT, PATCH, DELETE) are validated via
Origin/Referer header matching in [`middleware.ts`](../../src/middleware.ts):

1. The `Origin` (or `Referer` fallback) is extracted.
2. Its host is compared to the request's `Host` header.
3. If they don't match, the request is rejected with `403`.

This complements the `SameSite=Lax` cookie: Lax blocks cross-site POSTs from
simple forms but allows top-level GET navigations. The Origin check closes the
gap for state-changing API calls.

GET/HEAD/OPTIONS are exempt (they must be safe + idempotent by HTTP spec).

---

## Request Body Size Limit

Enforced in middleware before the route handler reads the body:

| Route                                    | Limit                                      |
| ---------------------------------------- | ------------------------------------------ |
| General admin API                        | 1 MB                                       |
| Media upload (`/api/admin/media/upload`) | 12 MB (handler enforces 10 MB on the file) |

Prevents memory-exhaustion DoS from oversized payloads.

---

## Audit Logging

Every mutation is logged to the `ActivityLog` table via `logActivity()` /
`audit()`:

```ts
await logActivity({
    userId: session.sub,
    userName: session.name,
    action: "user.login",
    level: "success",
    ip: "1.2.3.4",
    entity: "users",
    entityId: "uuid",
    details: "optional context",
});
```

The admin dashboard's "Recent Activity" widget reads from this table.

---

## Secure Error Handling

- **Never leak internals**: the `withLogging` HOF catches uncaught errors, logs
  the full stack trace to Pino, and returns a generic `500` with a `requestId`.
  The client never sees the raw error message (which could leak DB connection
  strings, file paths, etc.).
- **Generic auth errors**: login returns "Invalid email or password." for both
  bad email and bad password (anti-enumeration).
- **Forgot password**: always returns `200 { ok: true }` regardless of whether
  the email exists (anti-enumeration).

---

## Pino Logging Security

The logger **never** logs secrets. The `REDACT_PATHS` list strips known
sensitive keys from every log object before serialization. See
[logging.md](./logging.md) for details.

---

## Production Strictness

In production (`NODE_ENV=production`), `assertProductionSecrets()` throws if
any required secret is missing or weak:

- `DATABASE_URL` — must be a valid Postgres connection string
- `ADMIN_JWT_SECRET` — must be ≥ 32 bytes
- `AUTH_SECRET` — must be ≥ 32 bytes

This is lazy (not at import time) so `next build` doesn't crash on a missing
secret — the check fires on the first real request.
