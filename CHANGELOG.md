# Changelog

All notable changes to Kandarp OS are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased] — 2026-07-29 — Runtime Hydration Stability

### Fixed

- Development Content Security Policy now permits the code evaluation required by the Next.js development runtime while retaining the strict production policy.
- Development `connect-src` now permits local WebSocket connections for hot-module replacement.
- React hydration now completes locally, restoring navigation, buttons, filters, modals, copy controls, Framer Motion, Lenis, GSAP, and Three.js behavior.
- The System Information terminal now uses running-state and session-generation guards so stale cancellation state cannot prevent its typing sequence from starting.
- Reduced-motion users continue to receive the complete static terminal transcript.

### Documentation

- Added `docs/runtime-hydration-fixes.md` with the root cause, security boundary, implementation details, validation steps, and troubleshooting guidance.
- Added the runtime hydration guide to the documentation index and reading order.

### Validation

- `npm run typecheck` — zero errors.
- `npm run build` — successful; all 18 application routes generated.
- Eleven public and preview routes returned HTTP 200 with non-empty HTML in development.
- Existing lint warnings remain non-blocking; no lint errors were introduced.

## [1.0.0] — 2026-07-26 — Phase 1: Frontend Foundation

### Summary

Complete codebase cleanup and rebuild of the project foundation. The repository is now a clean, stable, **frontend-only** Next.js application. All backend, admin, API, database, Docker, and authentication code has been removed. The site renders entirely from hardcoded, typed content.

### Removed — Backend & Infrastructure

- **`src/backend/`** — the entire backend (Prisma client, auth, repositories, services, controllers, middleware, logging, storage, cache revalidation, permissions/RBAC).
- **`src/app/admin/`** — the entire admin console (40+ pages).
- **`src/app/api/`** — all API routes (100+ route handlers).
- **`src/features/admin/`** — admin UI components.
- **`prisma/`** — schema, migrations, seed script.
- **`src/middleware.ts`** — admin authentication gate (JWT, rate limiting, CSRF, body-size limits).
- **Docker** — `Dockerfile`, `docker-compose.yml`, `docker-compose.server.yml`, `.dockerignore`.
- **Nginx** — `nginx.conf`, `nginx-kandarp.conf`.
- **Deployment scripts** — `deploy-setup.sh`, `obtain-cert.sh`, `cert-renew-test.sh`, `open-ports.sh`, `fix-env.sh`, `fix-iptables-persist.sh`, `check-dns.sh`, `check-auth-dns.sh`, `migrate-seed*.sh`.
- **Refactor scripts** — `scripts/refactor/phase*.ps1` (one-time migration tooling).
- **Misc** — `about_raw.html`, `h.html`, `vercel.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.env.example`.
- **Obsolete docs** — `docs/deployment-aws.md`, `docs/REFACTORING-REPORT.md`, `docs/host-nextjs-on-vercel.pdf`, `docs/backend/`.

### Removed — Dependencies

- `@auth/prisma-adapter`, `@prisma/client`, `prisma` (database/ORM)
- `next-auth` (authentication)
- `argon2` (password hashing)
- `cloudinary` (media CDN)
- `pino`, `pino-http`, `pino-pretty` (logging)
- `sharp` (image processing)
- `nanoid` (id generation)
- `tsx` (dev script runner)
- All `db:*` and prisma scripts from `package.json`.

### Added — Frontend-Only Data Layer

- **`src/lib/public-data.ts`** — frontend-only content accessors. Mirrors the exact exports of the previous `@backend/services/public-data`, returning hardcoded seed data directly. This is the seam Phase 2 will swap for a CMS.
- **`src/lib/site-types.ts`** — shared view-model types (`NavItem`, `SocialLink`, `FooterColumn`, `SectionConfig`, `AnalyticsEvent`) replacing `@backend/schemas/types`.
- **`src/lib/revalidate.ts`** — inert ISR tag registry replacing `@backend/cache/revalidate`.

### Changed

- **`tsconfig.json`** — `@backend/*` path aliases now redirect to the `src/lib/*` shims, so no public component required editing.
- **`src/app/layout.tsx`** — removed the admin layout branch and `headers()` import.
- **`src/app/page.tsx`** — removed the `primaryResume` data fetch (no resume in FE-only build).
- **`next.config.mjs`** — removed `output: "standalone"`, Cloudinary CSP entries, Docker comments; added `outputFileTracingRoot`.
- **`package.json`** — cleaned to frontend-only dependencies; removed all `db:*` scripts.

### Fixed

- `src/features/hero/components/HeroSection.tsx` — prettier indentation in button variant classes.
- `src/features/navigation/components/Navbar.tsx` — `useMemo` exhaustive-deps (added `socials`).

### Validation

- `npm install` — ✅ 595 packages, no conflicts.
- `npm run typecheck` — ✅ zero errors (strict mode).
- `npm run lint` — ✅ zero errors (6 pre-existing warnings on intentional static index-keys).
- `npm run build` — ✅ all 18 routes prerendered as static content. First Load JS shared: ~103 kB.

### Migration Notes

- **Content editing** now happens in [`src/data/*.ts`](src/data/) (typed, Zod-validated). See the README "Editing Content" table.
- **No environment variables are required** for the frontend-only build. `NEXT_PUBLIC_SITE_URL` is optional (defaults to `https://kandarp.online`).
- The `@backend/*` imports in public components are intentional and resolve to shims — do not "fix" them until Phase 2.
