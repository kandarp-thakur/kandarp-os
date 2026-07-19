# Backend — Kandarp OS Admin

> Production-grade secure backend for the Kandarp OS portfolio platform.
> PostgreSQL + Prisma + Argon2id + Pino + Cloudinary, built on Next.js 15 App Router Route Handlers.

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication & Sessions](#authentication--sessions)
- [Security](#security)
- [Logging](#logging)
- [Media Storage](#media-storage)
- [API Reference](#api-reference)
- [Related Docs](#related-docs)

---

## Architecture

The backend follows a **repository pattern** with an **anti-corruption layer** so the
route handlers never touch Prisma directly — they call `repo.ts` functions that return
plain entity objects. This keeps the ~120 route handlers identical to the original
file-based store implementation while the persistence layer swapped from JSON files to
PostgreSQL underneath.

```
┌─────────────────────────────────────────────────────────────┐
│  Edge Middleware (src/middleware.ts)                        │
│  • JWT signature verify (Web Crypto HMAC-SHA256)             │
│  • Rate limiting (in-memory sliding window)                 │
│  • CSRF origin check (POST/PUT/PATCH/DELETE)                 │
│  • Request body size limit (1 MB / 12 MB uploads)            │
│  • Layout isolation header (x-is-admin: 1)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Route Handlers (src/app/api/admin/**/route.ts)              │
│  • withLogging HOF → request lifecycle + correlation ID      │
│  • requireAuth() / requirePermission() → two-layer session    │
│  • parseBody() → Zod validation                               │
│  • audit() → activity log                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Repository Layer (src/lib/admin/repo-prisma.ts)             │
│  • list / query / findById / findByField                      │
│  • create / update / remove / duplicate                        │
│  • count / bulkDelete / bulkArchive / reorder                 │
│  • Entity ↔ Prisma mapping (anti-corruption layer)            │
│  • Relationship sync (many-to-many join tables)                │
│  • Version history (polymorphic Version table)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Prisma Client (src/lib/admin/db.ts)                         │
│  • Singleton (global cache for dev hot-reload)                │
│  • Connection pooling (Prisma built-in)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    PostgreSQL
```

### Key Files

| File                                                                               | Purpose                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`src/middleware.ts`](../../src/middleware.ts)                                     | Edge auth gate + security controls             |
| [`src/lib/admin/db.ts`](../../src/lib/admin/db.ts)                                 | Prisma client singleton                        |
| [`src/lib/admin/repo-prisma.ts`](../../src/lib/admin/repo-prisma.ts)               | Repository layer (Prisma-backed)               |
| [`src/lib/admin/repo.ts`](../../src/lib/admin/repo.ts)                             | Repository re-export (swap point)              |
| [`src/lib/admin/auth.ts`](../../src/lib/admin/auth.ts)                             | Argon2id hashing + JWT signing                 |
| [`src/lib/admin/session-service.ts`](../../src/lib/admin/session-service.ts)       | Session lifecycle (create/validate/revoke)     |
| [`src/lib/admin/session.ts`](../../src/lib/admin/session.ts)                       | Cookie + activity log helpers                  |
| [`src/lib/admin/api.ts`](../../src/lib/admin/api.ts)                               | Route handler helpers (requireAuth, parseBody) |
| [`src/lib/admin/rbac.ts`](../../src/lib/admin/rbac.ts)                             | Role-Based Access Control matrix               |
| [`src/lib/admin/crud.ts`](../../src/lib/admin/crud.ts)                             | CRUD factory (generic handlers)                |
| [`src/lib/admin/storage.ts`](../../src/lib/admin/storage.ts)                       | Storage abstraction (local + Cloudinary)       |
| [`src/lib/admin/image-optimization.ts`](../../src/lib/admin/image-optimization.ts) | Sharp image pipeline (variants + blur)         |
| [`src/lib/admin/logger.ts`](../../src/lib/admin/logger.ts)                         | Pino structured logging                        |
| [`src/lib/admin/with-logging.ts`](../../src/lib/admin/with-logging.ts)             | Request logging HOF                            |
| [`src/lib/admin/env-schema.ts`](../../src/lib/admin/env-schema.ts)                 | Zod env validation                             |
| [`src/lib/admin/types.ts`](../../src/lib/admin/types.ts)                           | Entity schemas (Zod) + CollectionName          |
| [`prisma/schema.prisma`](../../prisma/schema.prisma)                               | Database schema                                |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your secrets
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL

# 3. Create the database + run migrations
npx prisma migrate dev --name init

# 4. Seed the database (creates the owner account + demo content)
npx prisma db seed   # or: npm run dev (auto-seeds on first request)

# 5. Start the dev server
npm run dev
```

The admin console is at `http://localhost:3000/admin/login`.

Default owner credentials (change immediately in production):

- Email: `admin@kandarp.online`
- Password: `ChangeMe!2026`

---

## Environment Variables

All environment variables are validated by a Zod schema at boot
([`env-schema.ts`](../../src/lib/admin/env-schema.ts)). Missing required
variables throw a clear, actionable error — never a silent fallback in
production.

### Required (Production)

| Variable           | Purpose                          | Example                                                                    |
| ------------------ | -------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string     | `postgresql://user:pass@localhost:5432/kandarp`                            |
| `ADMIN_JWT_SECRET` | JWT signing secret (≥ 32 bytes)  | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `AUTH_SECRET`      | General auth secret (≥ 32 bytes) | (same generation command)                                                  |

### Optional (Production — enables features)

| Variable                   | Purpose                                   | Default        |
| -------------------------- | ----------------------------------------- | -------------- |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name (enables CDN media) | — (local disk) |
| `CLOUDINARY_API_KEY`       | Cloudinary API key                        | —              |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret                     | —              |
| `CLOUDINARY_UPLOAD_FOLDER` | Cloudinary upload folder prefix           | `kandarp-os`   |
| `CONTACT_EMAIL_API_KEY`    | Contact form email provider key           | —              |
| `CONTACT_EMAIL_TO`         | Contact form recipient                    | —              |
| `CONTACT_EMAIL_FROM`       | Contact form sender                       | —              |

### Optional (Development defaults applied)

| Variable               | Default                       | Notes                                     |
| ---------------------- | ----------------------------- | ----------------------------------------- |
| `NODE_ENV`             | `development`                 | `production` enables strict secret checks |
| `LOG_LEVEL`            | `info` (prod) / `debug` (dev) | Pino log level                            |
| `ADMIN_OWNER_EMAIL`    | `admin@kandarp.online`        | Seed owner email                          |
| `ADMIN_OWNER_PASSWORD` | `ChangeMe!2026`               | Seed owner password (min 8 chars)         |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000`       | Public site URL                           |

See [`configuration.md`](./configuration.md) for the full reference.

---

## Database

### Schema

The schema is defined in [`prisma/schema.prisma`](../../prisma/schema.prisma) and
covers ~20 entities: Users, Sessions, Roles, Permissions, Projects, Experience,
Skills, Infrastructure, Awards, Blog Posts, Media, Settings, Profile,
SiteCustomization, Education, Certificates, Services, Resumes, Activity Logs,
Analytics Events, and Version History.

### Migrations

```bash
# Create + apply a migration after changing schema.prisma
npx prisma migrate dev --name <descriptive_name>

# Apply migrations in production (no schema drift)
npx prisma migrate deploy

# Reset the database (dev only — drops all data)
npx prisma migrate reset
```

### Soft Delete

Entities use `archivedAt` (nullable timestamp) for soft delete. The repository
layer's `remove()` sets `archivedAt = now()` instead of deleting the row; `list()`
and `query()` exclude archived rows by default. Use `bulkRestore` to un-archive.

### Version History

Every `update()` to an entity pushes a snapshot to the polymorphic `Version` table.
Use `restoreVersion()` to roll back to a prior state.

---

## Authentication & Sessions

### Password Hashing

- **Argon2id** (m=64 MiB, t=3, p=4) — the OWASP-recommended memory-hard KDF.
- **Legacy scrypt** hashes are verified and **transparently rehashed** to Argon2id
  on the next successful login (zero-downtime migration).
- See [`auth.ts`](../../src/lib/admin/auth.ts) → `hashPassword`, `verifyPassword`, `needsRehash`.

### JWT + Stateful Sessions (Two-Layer)

1. **Edge layer** — `middleware.ts` verifies the JWT signature with Web Crypto
   (HMAC-SHA256) without a database hit. This is fast and stateless.
2. **Route layer** — `requireAuth()` calls `validateSession(sid)` which checks the
   `Session` table: exists, not revoked, not expired. This is the security guarantee
   that makes per-device logout and "logout everywhere" work instantly.

### Session Lifecycle

| Action                | Function                | Effect                                          |
| --------------------- | ----------------------- | ----------------------------------------------- |
| Login                 | `createSession()`       | Persists a `Session` row, returns `sid` for JWT |
| Every request         | `validateSession()`     | Checks row + heartbeat + lazy cleanup           |
| Logout                | `revokeSession()`       | Sets `revokedAt = now`                          |
| Password change       | `revokeOtherSessions()` | Force other devices to re-auth                  |
| Role change / suspend | `revokeAllSessions()`   | Force logout everywhere                         |
| Device list           | `listActiveSessions()`  | For the device management UI                    |

### Session TTLs

- Default: **8 hours**
- "Remember me": **30 days**

See [`security.md`](./security.md) for the full threat model.

---

## Security

### Defense in Depth

| Layer | Control                                              | File                     |
| ----- | ---------------------------------------------------- | ------------------------ |
| Edge  | JWT signature verify                                 | `middleware.ts`          |
| Edge  | Rate limiting (120 req/60s/IP)                       | `middleware.ts`          |
| Edge  | CSRF origin check                                    | `middleware.ts`          |
| Edge  | Request body size limit (1 MB)                       | `middleware.ts`          |
| Edge  | Security headers (HSTS, CSP, nosniff, frame-options) | `next.config.mjs`        |
| Route | Two-layer session validation                         | `api.ts`                 |
| Route | RBAC permission check                                | `api.ts` → `rbac.ts`     |
| Route | Zod input validation                                 | `api.ts` → `parseBody()` |
| Route | Audit logging                                        | `api.ts` → `audit()`     |
| Data  | Argon2id password hashing                            | `auth.ts`                |
| Data  | Secret redaction in logs                             | `logger.ts`              |
| Data  | Env validation (fail-fast)                           | `env-schema.ts`          |

### RBAC Roles

| Role     | Permissions                                         |
| -------- | --------------------------------------------------- |
| `owner`  | Everything (full access)                            |
| `admin`  | All except user management + settings               |
| `editor` | Content (projects, blog, media) — no users/settings |
| `viewer` | Read-only                                           |

See [`security.md`](./security.md) for the full matrix and threat model.

---

## Logging

[Pino](https://github.com/pinojs/pino) structured logging — newline-delimited JSON
for log aggregators (Loki, Datadog, ELK).

- **Redaction** — secrets (passwords, tokens, cookies, env vars) are stripped from
  every log object before serialization. See `REDACT_PATHS` in `logger.ts`.
- **Correlation IDs** — every request gets a `reqId` (UUID) bound to a child logger
  and returned in the `x-request-id` response header.
- **Request lifecycle** — `withLogging` HOF logs `request.start` + `request.end`
  (with status + duration) and catches uncaught errors with stack traces.
- **Security events** — login failures, session revocation, permission denials,
  and validation errors are logged at `warn`/`error` level.

See [`logging.md`](./logging.md) for log levels, redaction, and correlation.

---

## Media Storage

The storage abstraction ([`storage.ts`](../../src/lib/admin/storage.ts)) lets the
app run with local disk (dev) or Cloudinary (prod) with zero route changes.

- **Local** — files in `public/media/`, served statically by Next.js.
- **Cloudinary** — files uploaded to a Cloudinary cloud; variants are on-the-fly
  URL transforms (no separate variant files).

The provider is selected at module load: if `CLOUDINARY_CLOUD_NAME` is set,
Cloudinary is used; otherwise local disk.

The image-optimization pipeline (sharp) generates responsive variants
(thumbnail/medium/large) in the original format + WebP + AVIF, plus an inline
blur placeholder. For Cloudinary, variants are URL transforms; for local, they're
separate files on disk.

See [`media.md`](./media.md) for storage setup and Cloudinary configuration.

---

## API Reference

All admin API routes are under `/api/admin/`. See [`api-reference.md`](./api-reference.md)
for the full endpoint list.

### Auth

| Method | Path                              | Permission | Description                        |
| ------ | --------------------------------- | ---------- | ---------------------------------- |
| POST   | `/api/admin/auth/login`           | public     | Authenticate, set session cookie   |
| POST   | `/api/admin/auth/logout`          | auth       | Revoke session, clear cookie       |
| GET    | `/api/admin/auth/me`              | auth       | Current user profile               |
| GET    | `/api/admin/auth/sessions`        | auth       | List active sessions (devices)     |
| DELETE | `/api/admin/auth/sessions`        | auth       | Revoke a session / all others      |
| POST   | `/api/admin/auth/change-password` | auth       | Change password (re-auth required) |
| POST   | `/api/admin/auth/forgot`          | public     | Request password reset email       |

### CRUD (per collection)

Every content collection follows the same pattern via the CRUD factory:

| Method | Path                                           | Permission            | Description                        |
| ------ | ---------------------------------------------- | --------------------- | ---------------------------------- |
| GET    | `/api/admin/<collection>`                      | `<collection>:read`   | List (paginated, filtered, sorted) |
| POST   | `/api/admin/<collection>`                      | `<collection>:write`  | Create                             |
| GET    | `/api/admin/<collection>/<id>`                 | `<collection>:read`   | Get one                            |
| PATCH  | `/api/admin/<collection>/<id>`                 | `<collection>:write`  | Update                             |
| DELETE | `/api/admin/<collection>/<id>`                 | `<collection>:delete` | Soft-delete                        |
| POST   | `/api/admin/<collection>/bulk`                 | `<collection>:write`  | Bulk actions                       |
| POST   | `/api/admin/<collection>/reorder`              | `<collection>:write`  | Reorder                            |
| POST   | `/api/admin/<collection>/<id>/duplicate`       | `<collection>:write`  | Duplicate                          |
| POST   | `/api/admin/<collection>/<id>/archive`         | `<collection>:write`  | Archive                            |
| POST   | `/api/admin/<collection>/<id>/restore`         | `<collection>:write`  | Restore                            |
| POST   | `/api/admin/<collection>/<id>/restore-version` | `<collection>:write`  | Restore version                    |
| GET    | `/api/admin/<collection>/export`               | `<collection>:read`   | Export (JSON)                      |
| POST   | `/api/admin/<collection>/import`               | `<collection>:write`  | Import (JSON)                      |

---

## Related Docs

- [`security.md`](./security.md) — Threat model, RBAC matrix, session revocation
- [`configuration.md`](./configuration.md) — Every env var, its purpose, how to generate secrets
- [`logging.md`](./logging.md) — Log levels, redaction, correlation IDs
- [`media.md`](./media.md) — Storage providers, Cloudinary setup, image optimization
- [`api-reference.md`](./api-reference.md) — Full endpoint reference
