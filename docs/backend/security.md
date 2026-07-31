# Security — Kandarp OS Backend

> OWASP-aligned security controls: authentication, session management, RBAC,
> input validation, rate limiting, security headers, CSRF, secure cookies,
> audit logging, and secure error handling.

---

## Authentication

### Password Hashing

Passwords are hashed with **Argon2id** (the OWASP-recommended algorithm) via
[`auth.ts`](../../src/backend/auth/auth.ts):

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
The `can(role, permission)` function checks the role's default permission set.
Per-user `UserPermission` rows can explicitly grant or revoke a capability. The
route-layer `canUser()` resolver checks that row on every permission-protected
request; an explicit `true` or `false` takes precedence over the role matrix, while
no row falls back to the role. Request-time resolution makes override changes
immediately effective for active sessions without copying permission lists into
JWTs. Role changes still revoke sessions because the role claim is token-bound.

Contact records use `inbox:read`, `inbox:write`, and `inbox:delete` so inbox access
can be controlled independently from analytics and general content permissions.

See [`rbac.ts`](../../src/backend/permissions/rbac.ts),
[`user-permissions.ts`](../../src/backend/permissions/user-permissions.ts), and
[`api.ts`](../../src/backend/middlewares/api.ts) for enforcement details.

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
([`env-schema.ts`](../../src/backend/config/env-schema.ts)):

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

### Public Contact Submission (Route Handler)

- **Limit**: 5 requests / 15 minutes per client address
- **Implementation**: independent in-memory sliding window
- **Response**: `429 { "error": "Too many messages. Please try again later." }`
- **Address source**: first `X-Forwarded-For` value, then `X-Real-IP`, then
  `unknown`; the deployment proxy must replace untrusted forwarding headers

### Memory Bounds

The middleware and contact rate limiters evict stale buckets after their maps
exceed 10,000 entries, bounding memory in long-running processes. These in-memory
limits are per application instance; horizontally scaled deployments should use a
shared limiter such as Redis at the reverse proxy or application boundary.

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

State-changing admin requests (POST, PUT, PATCH, DELETE) are validated via
Origin/Referer header matching in [`middleware.ts`](../../src/middleware.ts):

1. The `Origin` (or `Referer` fallback) is extracted.
2. Its host is compared to the request's `Host` header.
3. If they don't match, the request is rejected with `403`.

This complements the `SameSite=Lax` cookie: Lax blocks cross-site POSTs from
simple forms but allows top-level GET navigations. The Origin check closes the
gap for state-changing authenticated API calls.

The public contact route performs the same host comparison in
[`route.ts`](../../src/app/api/contact/route.ts). When neither `Origin` nor
`Referer` is present, the route accepts the request for non-browser client
compatibility; rate limiting and schema validation still apply. Deployments that
require browser-only submissions should reject missing source headers at the
reverse proxy.

GET/HEAD/OPTIONS are exempt (they must be safe + idempotent by HTTP spec).

---

## Request Body Size Limit

Admin limits are enforced in middleware before the route handler reads the body.
The public contact route additionally counts bytes while consuming the Web Streams
body, so chunked requests and requests without `Content-Length` cannot bypass its
limit.

| Route                                    | Limit                                      |
| ---------------------------------------- | ------------------------------------------ |
| General admin API                        | 1 MB                                       |
| Media upload (`/api/admin/media/upload`) | 12 MB (handler enforces 10 MB on the file) |
| Public contact (`/api/contact`)          | 32 KB of actual stream bytes               |

These limits reduce memory-exhaustion risk from oversized payloads.

---

## Contact Submission Security

The public contact handler in [`route.ts`](../../src/app/api/contact/route.ts) and
persistence service in
[`contact-submissions.ts`](../../src/backend/services/contact-submissions.ts)
apply defense in depth:

- **Schema bounds**: name, email, subject, message, and honeypot lengths are
  constrained before persistence.
- **Honeypot neutrality**: a populated `website` field returns the same outward
  `{ "ok": true }` shape with status `202`, but no database row is created.
- **Durable source of truth**: the normalized contact row is committed before
  best-effort analytics. A telemetry failure cannot discard a message.
- **No raw IP storage**: the client address is transformed with HMAC-SHA256. The
  stored hash supports privacy-safe correlation without exposing the address.
- **Key separation**: `CONTACT_HASH_SECRET` is optional and must be at least 32
  bytes when supplied. It falls back to `ADMIN_JWT_SECRET`; use a dedicated value
  in production when independent rotation is required.
- **Rotation effect**: changing the HMAC key intentionally prevents new address
  hashes from correlating with hashes produced under the previous key.
- **Bounded metadata**: user-agent data is truncated to 512 characters.
- **DTO separation**: neither the address hash nor user agent is returned by the
  public endpoint or admin inbox APIs.
- **Generic persistence errors**: database failures return a generic `503`; full
  details remain in server logs.

The inbox is protected by dedicated RBAC permissions. Status transitions and
permanent deletions are written to the activity audit log.

---

## API Credential Security

Programmatic credentials are dedicated database records and are never stored in
the settings singleton. The server creates each credential from 32 bytes of
cryptographically secure randomness and prefixes it with `kos_`. The raw secret
is returned once; only its SHA-256 digest and a display-safe prefix are persisted.
The secret's 256 bits of random entropy make offline guessing impractical.

Credential authentication enforces all of the following:

- strict `Authorization: Bearer <secret>` parsing;
- constant-time digest comparison after indexed lookup;
- enabled state and immutable revocation state;
- optional expiry;
- active owner-account status;
- an explicit allowlisted scope for each versioned route; and
- `lastUsedAt` tracking after successful authentication.

Authentication errors do not reveal whether a credential is unknown, disabled,
revoked, expired, or owned by a suspended user. A valid but under-scoped key
receives a generic `403`. Authorization headers and raw creation secrets must
never be included in logs or audit details. Secret-bearing and authenticated
responses use `Cache-Control: no-store`; authenticated versioned responses also
set `Vary: Authorization`.

Credential lifecycle mutations require dedicated RBAC permissions and create
`api-key.create`, `api-key.update`, and `api-key.revoke` audit events. Audit
details contain names, changed field names, and scopes only—never secrets or
hashes. Revocation cannot be reversed or repeated; a replacement credential must
be created instead.

Migration `0003_api_keys` intentionally drops all legacy settings-backed
plaintext credentials. They are treated as potentially disclosed and must be
reissued after deployment rather than copied into the secure credential table.

---

## Managed Integration Secret Security

Integration configuration values and managed environment values are encrypted at
rest with AES-256-GCM. Every value receives an independent random 96-bit IV and
authentication tag. The encryption key is derived from the dedicated
`MANAGED_SECRETS_KEY`; production readiness rejects missing or weak key material.
Signing keys are not used for encryption.

Administrative reads expose only names and `configured` state. They never decrypt
or return values, ciphertext, IVs, or authentication tags. Updates preserve an
existing value when `value` is omitted, replace it when a non-empty value is
supplied, and delete it when its field or parent record is omitted. Runtime-only
integration consumers may use the server-side decryptor, but no administrative API
has a plaintext read operation.

The generic settings endpoint strictly excludes and rejects `integrations` and
`environmentVariables`. Dedicated routes require `integrations:read` or
`integrations:write`, which are granted only to administrators and owners. Responses
use `Cache-Control: no-store`, and audits record counts only, never field values.
Portable JSON backups omit managed-secret fields and user identity records.

Migration `0004_managed_secrets` clears legacy generic JSON values because they were
previously recoverable through settings and backups. Treat those credentials as
potentially disclosed: revoke or rotate them with each provider, then re-enter the
replacement values through the dedicated interface. Preserve
`MANAGED_SECRETS_KEY` in deployment secret management; losing or changing it makes
stored values undecryptable.

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
