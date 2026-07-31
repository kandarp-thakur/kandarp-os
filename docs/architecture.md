# Architecture — Kandarp OS Full-Stack Platform

> Runtime architecture, data flow, security boundaries, and operational components for the portfolio and administration system.

## Current Architecture

Kandarp OS is a Next.js 15 App Router application with two integrated surfaces:

- a public engineering portfolio rendered from PostgreSQL-backed CMS data;
- an authenticated administration console for content, identity, analytics, media, appearance, and operations.

The application uses React Server Components by default and client components only for interactive editors, navigation, terminals, animation, and Three.js scenes.

## 2. Runtime Layers

```text
Browser
  │
  ├─ Public routes ──────────────────────────────────────────────┐
  │                                                             │
  └─ Admin routes / API requests                                │
        │                                                       │
        ▼                                                       ▼
Next.js middleware                                      App Router pages
  • signed JWT gate                                     • server rendering
  • rate limits                                         • public view models
  • CSRF origin checks                                  • admin client editors
  • request-size limits                                         │
        │                                                       │
        ▼                                                       │
Route handlers ◄────────────────────────────────────────────────┘
  • authentication and stateful session validation
  • request-time RBAC and per-user overrides
  • Zod validation and consistent errors
  • audit and request logging
        │
        ▼
Controllers and services
  • generic CRUD orchestration
  • domain workflows
  • public-data mapping and cache invalidation
  • media, managed secrets, API keys, analytics, health
        │
        ▼
Repository and persistence layer
  • Prisma singleton
  • PostgreSQL entities and relationships
  • soft deletion, archive/restore, versions
  • local or Cloudinary object storage
```

## 3. Source Boundaries

| Path | Responsibility |
| --- | --- |
| `src/app/(public)` | Public portfolio routes |
| `src/app/admin` | Login and authenticated administration pages |
| `src/app/api/admin` | Session-authenticated administration APIs |
| `src/app/api/v1` | API-key-authenticated programmatic APIs |
| `src/app/api/health` | Liveness and readiness endpoints |
| `src/backend/auth` | Passwords, JWTs, TOTP, and session lifecycle |
| `src/backend/controllers` | Reusable HTTP/CRUD controllers |
| `src/backend/database` | Prisma client and persistence infrastructure |
| `src/backend/middlewares` | Auth, API-key auth, validation, logging, and request context |
| `src/backend/permissions` | Static role matrix and request-time user overrides |
| `src/backend/repositories` | Entity persistence and mapping |
| `src/backend/services` | Domain workflows and public CMS view models |
| `src/backend/storage` | Storage-provider abstraction |
| `src/backend/schemas` | Zod input and entity contracts |
| `src/features` | Public and admin feature components |
| `src/infrastructure` | Providers, styles, and Three.js implementation |
| `prisma` | PostgreSQL schema, migrations, and idempotent seed |

## 4. Public Content Flow

```text
PostgreSQL
  → Prisma repository/service queries
  → src/backend/services/public-data.ts
  → validated public view models
  → cached server components
  → feature components
```

`public-data.ts` is the anti-corruption boundary between mutable CMS entities and stable public UI models. It handles status filtering, media resolution, relation mapping, defaults, and cache-aware accessors. Mutating admin handlers invalidate the relevant Next.js cache tags so published changes become visible without coupling public components to Prisma.

Seed constants in `src/data` remain useful defaults and demo inputs, but PostgreSQL is the runtime source of truth.

## 5. Administration Flow

The sidebar configuration lives in `src/features/admin/components/nav-config.ts`. Its links map to pages under the `src/app/admin/(console)` route group; query-string views intentionally share parent pages.

Administration pages call `/api/admin/*` handlers. Shared handler utilities provide:

1. signed-token verification;
2. persisted session validation and heartbeat;
3. permission enforcement;
4. Zod request validation;
5. normalized JSON errors;
6. activity/audit recording.

Generic entity modules use the CRUD controller and repository abstractions for list, create, read, update, archive, restore, duplicate, reorder, import/export, bulk operations, and version restoration. Specialized services implement workflows that do not fit generic CRUD.

## 6. Authentication and Authorization

Authentication uses Argon2id password hashes, signed HMAC-SHA256 JWT cookies, optional TOTP, and persisted sessions. Middleware performs the fast signature gate; protected route handlers then verify that the session is present, unrevoked, and unexpired.

Authorization has two layers:

- `ROLE_PERMISSIONS` supplies role defaults for owner, admin, editor, and viewer;
- `UserPermission` rows explicitly grant or deny one permission for one user.

Explicit user decisions take precedence over role defaults. Protected handlers resolve overrides at request time, so grants and denials apply immediately to active sessions without issuing a new token. Role changes still revoke sessions because the role claim itself is carried by the JWT.

Programmatic `/api/v1` access uses separately stored API keys. Raw keys are shown once; only hashes and safe prefixes are retained. Scope, status, expiration, and revocation are checked on each request.

## 7. Data Model and Lifecycle

The Prisma schema models content, users, sessions, normalized RBAC, API keys, media, analytics, activity logs, settings, profiles, submissions, and version history.

Content entities support soft deletion through archive metadata. Repository queries exclude archived rows by default, while explicit archive/restore endpoints preserve recoverability. Version snapshots support rollback for mutable content.

Migrations are immutable deployment artifacts under `prisma/migrations`. `prisma/seed.ts` is idempotent: repeated execution upserts system RBAC and owner data while avoiding duplicate demo content.

## 8. Media and Managed Secrets

Media storage is selected by configuration:

- local storage writes deploy-local files for development and single-node use;
- Cloudinary provides durable remote storage and transformations when all provider credentials are present.

Managed integration and environment values are encrypted using AES-256-GCM. The encryption key is separate from authentication signing keys. API responses expose metadata and masked state rather than plaintext secrets.

## 9. Analytics, Monitoring, and Health

The public analytics beacon persists bounded events. Administration views aggregate those events for dashboard and analytics modules. Activity logs separately record security and administrative mutations.

Health endpoints are split by orchestration semantics:

- liveness reports whether the process can answer requests;
- readiness verifies dependencies required to serve traffic, including PostgreSQL.

Structured Pino logging adds request context and correlation identifiers without exposing managed secret values.

## 10. Rendering, UI, and Three.js

Public pages use server rendering and cached data access. Interactive components are isolated client boundaries. Tailwind CSS and CSS custom properties provide shared public/admin tokens. Appearance settings control brand, theme, typography, color, navigation, footer, SEO, animation, and performance preferences.

Three.js scenes use React Three Fiber and Drei. Device-tier and reduced-motion hooks choose off/low/high fidelity, while Suspense fallbacks protect first paint and non-WebGL clients.

## 11. Deployment

The repository supports native Node deployment and Docker Compose. Production startup follows this order:

1. provide validated environment secrets;
2. provision PostgreSQL and durable media storage;
3. apply migrations with `npm run db:migrate:deploy`;
4. run the idempotent seed when system data is absent;
5. build and start the Next.js application;
6. route health probes to `/api/health/live` and `/api/health/ready`.

Do not run development and production processes against the same `.next` directory. On Windows, stop the development server before Prisma generation if its native query-engine DLL is locked.

## 12. Quality Gates

The expected local verification sequence is:

```text
npm run lint
npm run typecheck
npm test
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js validate
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js migrate status
npm run build
```

The seed should be run twice during release verification to confirm idempotency.

## Related Documentation

- `docs/backend/README.md` — backend and database operations
- `docs/backend/api-reference.md` — HTTP API
- `docs/backend/security.md` — security controls and RBAC
- `docs/backend/configuration.md` — environment configuration
- `docs/backend/media.md` — media providers and processing
- `docs/deployment-vercel.md` — deployment notes
- `docs/FOLDER_STRUCTURE.md` — source tree guide
- `CHANGELOG.md` — release history
