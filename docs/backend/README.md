# Backend — Kandarp OS Full-Stack Platform

> Operational guide for the Next.js 15, PostgreSQL, Prisma, Argon2id, Pino, and Cloudinary backend.

## Architecture

Kandarp OS uses Next.js App Router route handlers with explicit backend boundaries:

```text
src/middleware.ts
  → src/app/api/admin/**/route.ts or src/app/api/v1/**/route.ts
  → src/backend/middlewares
  → src/backend/controllers and src/backend/services
  → src/backend/repositories
  → src/backend/database/db.ts
  → PostgreSQL
```

Public pages do not query Prisma directly. `src/backend/services/public-data.ts` maps mutable CMS records to stable public view models and coordinates cache-aware reads. Admin route handlers use shared authentication, validation, authorization, audit, and error helpers. Generic content resources use the CRUD controller factory; specialized workflows remain domain services.

### Key Files

| File                                                                                               | Purpose                                                                           |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`src/middleware.ts`](../../src/middleware.ts)                                                     | Fast JWT gate, CSRF/origin checks, rate limits, body limits, and security headers |
| [`src/backend/database/db.ts`](../../src/backend/database/db.ts)                                   | Development-safe Prisma client singleton                                          |
| [`src/backend/repositories/repo.ts`](../../src/backend/repositories/repo.ts)                       | Repository interface and persistence access point                                 |
| [`src/backend/controllers/crud.ts`](../../src/backend/controllers/crud.ts)                         | Generic list/create/update/archive/restore/bulk/version handlers                  |
| [`src/backend/middlewares/api.ts`](../../src/backend/middlewares/api.ts)                           | Session auth, request-time RBAC, Zod parsing, errors, and audit helpers           |
| [`src/backend/auth/auth.ts`](../../src/backend/auth/auth.ts)                                       | Argon2id password and signed JWT implementation                                   |
| [`src/backend/auth/session-service.ts`](../../src/backend/auth/session-service.ts)                 | Persisted session creation, validation, heartbeat, and revocation                 |
| [`src/backend/permissions/rbac.ts`](../../src/backend/permissions/rbac.ts)                         | Static role defaults and override precedence                                      |
| [`src/backend/permissions/user-permissions.ts`](../../src/backend/permissions/user-permissions.ts) | Request-time per-user grant/deny lookup                                           |
| [`src/backend/services/public-data.ts`](../../src/backend/services/public-data.ts)                 | Public CMS anti-corruption/view-model layer                                       |
| [`src/backend/storage/storage.ts`](../../src/backend/storage/storage.ts)                           | Local and Cloudinary storage abstraction                                          |
| [`src/backend/services/image-optimization.ts`](../../src/backend/services/image-optimization.ts)   | Sharp image variants and placeholders                                             |
| [`src/backend/config/env-schema.ts`](../../src/backend/config/env-schema.ts)                       | Zod environment validation and production assertions                              |
| [`prisma/schema.prisma`](../../prisma/schema.prisma)                                               | PostgreSQL data model                                                             |
| [`prisma/seed.ts`](../../prisma/seed.ts)                                                           | Idempotent RBAC, owner, and demo-content seed                                     |

## Quick Start

Run commands from the repository root:

```bash
npm install

# Create .env.local and set at least DATABASE_URL for database commands.
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

The application runs at `http://localhost:3000`; the login page is `/admin/login`.

The development seed defaults to `admin@kandarp.online` / `ChangeMe!2026` only when owner credentials are not configured. Supply unique values and change the initial password before production use.

## Environment

All server environment values are parsed by `src/backend/config/env-schema.ts`. Production requests additionally enforce the required secrets.

| Variable               | Production requirement      | Purpose                               |
| ---------------------- | --------------------------- | ------------------------------------- |
| `DATABASE_URL`         | Required PostgreSQL URL     | Prisma datasource                     |
| `ADMIN_JWT_SECRET`     | Required, at least 32 bytes | Admin JWT signing                     |
| `AUTH_SECRET`          | Required, at least 32 bytes | General authentication key material   |
| `MANAGED_SECRETS_KEY`  | Required, at least 32 bytes | AES-256-GCM managed-secret encryption |
| `ADMIN_OWNER_EMAIL`    | Configure explicitly        | Seed owner identity                   |
| `ADMIN_OWNER_PASSWORD` | Configure explicitly        | Seed owner bootstrap password         |
| `NEXT_PUBLIC_SITE_URL` | Recommended                 | Canonical public URL                  |
| `CONTACT_HASH_SECRET`  | Recommended                 | Contact-address privacy hashing       |
| `CLOUDINARY_*`         | Optional as a complete set  | Durable remote media storage          |

Generate independent random secrets; do not reuse authentication and encryption keys:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

See [`configuration.md`](./configuration.md) for the complete variable reference and provider-selection rules.

## Database and Migrations

The checked-in migrations are immutable deployment artifacts. Use the package scripts because they load `.env.local` consistently:

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply a development migration after schema changes
npm run db:migrate -- --name descriptive_name

# Apply checked-in migrations in production
npm run db:migrate:deploy

# Inspect migration state explicitly
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js migrate status

# Validate schema and Prisma configuration
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js validate
```

Do not use `db push` for production releases. It bypasses migration history.

### Seed and Idempotency

```bash
npm run db:seed
npm run db:seed
```

Release verification runs the seed twice. System roles, permissions, role links, and the owner are upserted; demo collections are populated only when absent. Repeated execution must complete without duplicate records or constraint failures.

### Record Lifecycle

Content entities support archive metadata instead of destructive deletion. Normal lists exclude archived rows. Explicit archive and restore operations preserve recoverability, and mutable content records can retain snapshots in the polymorphic version table for rollback.

## Authentication and Sessions

Passwords use Argon2id. Legacy scrypt hashes are accepted during migration and upgraded after successful authentication.

Authentication is intentionally two-layered:

1. middleware verifies the signed JWT before protected admin routing;
2. route handlers validate the JWT session identifier against the persisted session row.

Persisted validation provides immediate logout, per-device revocation, expiration, and account-wide revocation. Default sessions last eight hours; remembered sessions last thirty days.

Optional TOTP provides a second authentication step. TOTP secrets and challenge tokens are never exposed in logs.

## Authorization

Four system roles provide default capabilities: `owner`, `admin`, `editor`, and `viewer`. Per-user `UserPermission` records can explicitly grant or deny a permission.

The effective decision is:

```text
explicit user grant or denial → role default when no override exists
```

Protected handlers resolve this decision at request time, so override changes affect active sessions immediately. Role changes revoke sessions because the role itself is represented in the signed token.

See [`security.md`](./security.md) for the permission model, API-key controls, CSRF boundary, managed-secret encryption, and threat mitigations.

## API Surfaces

| Surface                                    | Authentication                 | Purpose                                           |
| ------------------------------------------ | ------------------------------ | ------------------------------------------------- |
| `/api/admin/*`                             | HttpOnly admin session cookie  | Console operations and CMS CRUD                   |
| `/api/v1/*`                                | Scoped bearer API key          | Programmatic content and analytics reads          |
| `/api/health/live`                         | Public                         | Process liveness                                  |
| `/api/health/ready`                        | Public                         | Production configuration and dependency readiness |
| `/api/contact` and analytics beacon routes | Public with dedicated controls | Bounded public ingestion                          |

Admin API keys are disclosed once on creation. Only hashes and safe prefixes are stored. Every use checks scope, owner status, disabled/revoked state, and expiration.

See [`api-reference.md`](./api-reference.md) and [`openapi.yaml`](./openapi.yaml) for endpoint contracts.

## CRUD Contract

Content collections generally expose:

| Method                   | Path                                           | Operation                     |
| ------------------------ | ---------------------------------------------- | ----------------------------- |
| `GET`, `POST`            | `/api/admin/<collection>`                      | List and create               |
| `GET`, `PATCH`, `DELETE` | `/api/admin/<collection>/<id>`                 | Read, update, and soft-delete |
| `POST`                   | `/api/admin/<collection>/<id>/archive`         | Archive                       |
| `POST`                   | `/api/admin/<collection>/<id>/restore`         | Restore                       |
| `POST`                   | `/api/admin/<collection>/<id>/duplicate`       | Duplicate                     |
| `POST`                   | `/api/admin/<collection>/<id>/restore-version` | Restore a snapshot            |
| `POST`                   | `/api/admin/<collection>/bulk`                 | Bulk lifecycle/status action  |
| `POST`                   | `/api/admin/<collection>/reorder`              | Update display order          |
| `GET`, `POST`            | `/api/admin/<collection>/export`, `/import`    | JSON transfer                 |

Every protected mutation passes through permission checks and activity/audit recording. Zod validation failures and server errors use normalized JSON responses.

## Media and Managed Secrets

Local media writes to `public/media` and is appropriate for development or durable single-node deployments. Cloudinary is selected only when the complete provider credential set is configured and is recommended for serverless or multi-instance production.

Sharp creates responsive formats and blur placeholders for local images. See [`media.md`](./media.md).

Integration credentials and admin-managed environment values are encrypted with AES-256-GCM using `MANAGED_SECRETS_KEY`. Read APIs return metadata and configured/masked state, never plaintext or encrypted envelopes.

## Logging and Monitoring

Pino emits structured records with request correlation identifiers. Sensitive values are redacted. Administrative mutations are also written to the activity log, which is distinct from operational process logs.

Use `/api/health/live` for process restart decisions and `/api/health/ready` for traffic admission. See [`logging.md`](./logging.md).

## Verification

Run the release gates from a clean process state:

```bash
npm run lint
npm run typecheck
npm test
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js validate
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js migrate status
npm run db:seed
npm run db:seed
npm run build
```

On Windows, stop the development server before Prisma generation or production builds if the native query-engine DLL is locked. Never run `next dev` and `next build` concurrently against the same `.next` directory.

## Deployment

The multi-stage [`Dockerfile`](../../Dockerfile) produces Next.js standalone output. [`docker-compose.yml`](../../docker-compose.yml) provides the local PostgreSQL and application stack, while [`docker-compose.server.yml`](../../docker-compose.server.yml) defines the Oracle Cloud production services. See [`../deployment-oracle.md`](../deployment-oracle.md) for GitHub Actions deployment and server operations.

## Related Documentation

- [`../architecture.md`](../architecture.md) — runtime architecture and data flow
- [`security.md`](./security.md) — sessions, RBAC, API credentials, and security controls
- [`configuration.md`](./configuration.md) — environment configuration
- [`logging.md`](./logging.md) — logs, redaction, and correlation
- [`media.md`](./media.md) — storage and image processing
- [`api-reference.md`](./api-reference.md) — complete HTTP reference
- [`../FOLDER_STRUCTURE.md`](../FOLDER_STRUCTURE.md) — source placement guide
