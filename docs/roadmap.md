# Roadmap — Kandarp OS

A phased plan for rebuilding Kandarp OS from a clean frontend foundation into a full platform.

---

## Phase 1 ✅ — Frontend Foundation (Complete)

**Goal:** a clean, stable, maintainable, production-ready **frontend-only** application.

- [x] Remove all backend, admin, API, database, Docker, auth code.
- [x] Create a frontend-only data layer ([`src/lib/public-data.ts`](../src/lib/public-data.ts)) behind a stable interface.
- [x] Clean dependencies (removed Prisma, next-auth, argon2, cloudinary, pino, sharp, nanoid, tsx).
- [x] Strict TypeScript — zero type errors.
- [x] ESLint — zero errors.
- [x] Production build — all 18 routes prerendered.
- [x] Documentation rewritten (README, ARCHITECTURE, FOLDER_STRUCTURE, PROJECT_SPEC, COMPONENT_GUIDE, STYLE_GUIDE, ROADMAP, CHANGELOG).

**Status:** ✅ Shipped. The repository is ready for Phase 2.

---

## Phase 2 — Admin Panel

**Goal:** reintroduce content management behind the existing `src/lib/public-data.ts` interface, so the public site gains a CMS without any public-component changes.

- [ ] Design the admin domain schema (Projects, Blog, Experience, Skills, Infrastructure, Awards, Settings, Profile, Media, Users).
- [ ] Build the admin console UI (reuse the deleted `src/features/admin/` patterns).
- [ ] Implement a CMS-backed `public-data` module and repoint the `@backend/services/public-data` alias.
- [ ] Add ISR revalidation so admin edits appear on the public site.
- [ ] Authentication for the admin console (session-based, RBAC).
- [ ] Media library (upload, optimise, variants).

**Constraint:** the public site's component contracts must not change. Phase 1's shim signatures are the contract.

---

## Phase 3 — Backend & Infrastructure

**Goal:** production-grade backend, persistence, and deployment.

- [ ] Database (Prisma + Postgres) + migrations.
- [ ] REST API routes (CRUD per entity, import/export, bulk, reorder, archive/restore, version history).
- [ ] Security hardening (rate limiting, CSRF, body-size limits, CSP nonces).
- [ ] Observability (structured logging, request context, activity logs).
- [ ] Docker (multi-stage build, standalone output) + docker-compose.
- [ ] CI/CD pipeline.
- [ ] Cloud deployment (AWS / Vercel) with TLS, CDN, backups.

---

## Backlog (cross-phase)

- [ ] Performance: further code-split heavy 3D scenes; tune bundle budgets.
- [ ] Accessibility: full WCAG AA audit; keyboard-only navigation pass.
- [ ] Testing: introduce Vitest + Playwright (unit + e2e).
- [ ] i18n: if multilingual support is ever needed.
- [ ] Replace the remaining intentional index-key lint warnings with stable keys where lists can reorder.
