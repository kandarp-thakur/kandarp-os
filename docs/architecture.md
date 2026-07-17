# Architecture — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-16

> **Reality note (2026-07-16):** This document originally described an intended design. It has been synced to the code. Notable divergences from the original plan, now reflected below: the data layer lives in **`src/lib/admin/`** (a JSON-backed store), not the planned `src/services/` (which is empty); there is a full **Admin CMS** with HMAC-JWT auth and ~120 API routes under `/api/admin/` (no public `/api/contact` or `/api/projects`); the contact experience is a **terminal UI**, not a form; the theme is **dark-only** (no toggle/context); and there are **no GLSL shaders** (standard Three.js materials only). Sections below marked _(planned)_ describe intent that is not yet built.

---

## 1. Overview

Kandarp OS is a **single-tenant, client-heavy, server-augmented** Next.js application built on the **App Router**. The architecture prioritizes a rich, 3D-driven client experience while leveraging the server for SEO, data fetching, and API routes.

```
┌─────────────────────────────────────────────────────────┐
│                      USER (Browser)                     │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │  React UI │  │ 3D Engine │  │  Client State/Cache │   │
│  │ (RSC + CSR)│  │ (R3F/3js) │  │  (Context + Hooks)  │   │
│  └─────┬─────┘  └─────┬─────┘  └─────────┬──────────┘   │
└────────┼──────────────┼───────────────────┼──────────────┘
         │              │                   │
         ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER (Edge/Node)            │
│  ┌──────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ RSC Render│  │ API Routes │  │  Server Actions     │   │
│  │ (SSR/ISR) │  │ (/api/*)   │  │  (mutations)        │   │
│  └─────┬─────┘  └─────┬──────┘  └─────────┬──────────┘   │
└────────┼──────────────┼───────────────────┼──────────────┘
         │              │                   │
         ▼              ▼                   ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
│  Data Sources   │  │  Services   │  │  External APIs   │
│  (JSON/MDX)     │  │  (Email,    │  │  (GitHub, etc.)  │
│                 │  │   Analytics)│  │                  │
└─────────────────┘  └─────────────┘  └──────────────────┘
```

---

## 2. Architectural Pillars

### 2.1 Server-First Rendering
- **React Server Components (RSC)** are the default. Every component is a server component unless it explicitly needs interactivity.
- Client components are marked with the `"use client"` directive and are isolated to the leaves of the tree.
- Static pages use **Static Site Generation (SSG)** with **Incremental Static Regeneration (ISR)** where data changes.

### 2.2 3D as a First-Class Citizen
- The 3D layer is powered by **React Three Fiber (R3F)** and **Three.js**.
- 3D scenes are **lazy-loaded** and **code-split** to protect initial page weight.
- A **progressive enhancement** strategy: 3D enhances the experience but the site is fully usable without it (accessibility fallback).

### 2.3 Type-Safe Boundaries
- All data crossing a system boundary (server → client, API → consumer, file → module) is validated with **Zod** schemas.
- TypeScript types are derived from Zod schemas — **single source of truth**.
- No `any`. No `as` casts without a justification comment.

### 2.4 Composition Over Configuration
- The app is assembled from small, focused, composable units.
- No god-components. No 500-line files.
- Each component has **one responsibility** and a clear contract.

---

## 3. Rendering Strategy

| Route | Strategy | Rationale |
|-------|----------|-----------|
| `/` (home) | Server component + ISR (CMS-revalidated) | Single-page composition, SEO-critical |
| `/about` | Server component | CMS content with seed fallback |
| `/projects` | Server component | Reads CMS/seed data |
| `/experience`, `/skills`, `/infrastructure` | Server component | CMS/seed data |
| `/contact` | Server component | Terminal UI (commands), not a form |
| `/blog`, `/blog/tags`, `/blog/tags/[tag]` | SSG | MDX + CMS content |
| `/blog/[slug]` | SSG + `generateStaticParams` | Per-post SEO, static export |
| `/admin/*` | Dynamic (auth-gated) | HMAC-JWT session via middleware |
| `/api/admin/*` | Node runtime (auth-gated) | ~120 CMS route handlers |

> **Note:** There is no `/projects/[slug]`, `/api/contact`, or `/api/projects`. Projects render on the `/projects` listing and the home composition; the only API surface is `/api/admin/*` (plus a public `POST /api/admin/analytics`).

---

## 4. Data Flow

```
┌──────────────┐    Zod parse    ┌────────────────────┐   props   ┌──────────────┐
│  CMS store /  │ ─────────────▶ │  src/lib/admin/     │ ────────▶ │  Server       │
│  seed / MDX   │                │  public-data.ts     │           │  Component    │
└──────────────┘                 └────────────────────┘           └──────────────┘
     (.admin-data JSON, src/data seeds, content/blog MDX)
```

### 4.1 Data Sources
- **Structured seed data** lives in `src/data/` (12 typed modules) as the fallback source of truth.
- **CMS data** is the primary source: a JSON-backed store under `src/lib/admin/` (`store.ts`, `repo.ts`, `public-data.ts`) persisted to `.admin-data/`. Public pages read from it via `public-data.ts` and fall back to `src/data/` seeds.
- **Blog content** lives as MDX in `content/blog/`, read by `src/lib/blog.ts`.
- **External data** (GitHub repos, etc.) is _(planned)_ — `src/services/` exists but is empty; no external API integration is built yet.

### 4.2 Data Access Layer
- The data access layer is **`src/lib/admin/`**, not the originally planned `src/services/`.
- `public-data.ts` returns **validated, typed** data (Zod-parsed against `src/types/` schemas) to public server components.
- `crud.ts`, `repo.ts`, and `store.ts` back the admin CMS; `revalidate.ts` triggers ISR on content change.
- Public components receive data as props from server components; they never fetch directly.

### 4.3 Client State
- The app uses **no global client state library and no `src/context/`** (the directory is empty). Providers compose in `src/providers/` (`AnimationProvider` → `ThreeProvider`).
- Local component state uses `useState` / `useReducer` and small custom hooks (`src/hooks/`).
- Server state uses RSC data fetching from `src/lib/admin/public-data.ts` — **no external data-fetching library**.
- Theme is **dark-only**, set statically via `data-theme="dark"` on `<html>` — no theme context or toggle.

---

## 5. The 3D Subsystem

The 3D layer is isolated in `src/3d/` to keep it modular and replaceable.

```
src/3d/
├── Canvas3D.tsx      # Canvas wrapper (dynamically imported, ssr: false)
├── Environment3D.tsx # Environment / IBL setup
├── CameraRig.tsx     # Camera rig
├── LightingRig.tsx   # Lighting setup
├── PostProcessing.tsx# Bloom → DOF → Vignette → CA → Noise → SMAA (tier-gated)
├── PerformanceMonitor.tsx
├── presets.ts        # Tier presets
├── scenes/           # Scene3D + SceneFallback (2D fallback)
├── cloudInfinity/    # Signature object: geometry, material, particles, nodes
├── coderModel/       # Coder model + hologram
└── hooks/            # useDeviceTier, useReducedMotion, useCamera, useMouse, ...
```

> **Note:** There is no `shaders/` directory and no custom GLSL. Signature visuals use standard Three.js materials (`MeshPhysicalMaterial` transmission on high tier, `MeshStandardMaterial` fallback) with animation — code comments explicitly note effects are achieved "without a custom shader." Custom GLSL remains a Phase 3 aspiration.

### 5.1 Performance Contract

> _(Planned items below)_ Draco/KTX2 asset compression is not yet applied — signature 3D objects are procedural geometry, not loaded GLTF assets. The canvas is tier-gated by `useDeviceTier` and postprocessing is tier-gated (low/off render no effects).

- Device-tier detection (`useDeviceTier.ts`) scales scene complexity and gates postprocessing (low/off tiers render no post effects).
- The 3D canvas is dynamically imported with `{ ssr: false }` and mounts client-side only.
- A `prefers-reduced-motion` check (`useReducedMotion.ts`) disables animated effects.
- 3D asset compression (Draco/KTX2) is **not yet applied** — a Phase 3 item.

### 5.2 Fallback Strategy
- Every 3D scene has a **2D fallback** (image or CSS animation).
- Feature detection (`WebGL` support) determines which renders.
- No visitor is blocked from content by a missing GPU.

---

## 6. API Layer

API routes live in `src/app/api/` and follow RESTful conventions. In practice **all routes are under `src/app/api/admin/`** (~120 `route.ts` files) — there is no public `/api/contact` or `/api/projects`. The public site is rendered from server components reading `src/lib/admin/public-data.ts`, not from public API calls.

| Endpoint group | Method | Purpose | Runtime |
|----------------|--------|---------|---------|
| `/api/admin/auth/{login,logout,me,forgot}` | POST/GET | Admin session auth (HMAC-JWT cookie) | Node |
| `/api/admin/<entity>` | GET/POST | CRUD per entity (projects, blog, skills, …) | Node |
| `/api/admin/<entity>/[id]` | GET/PATCH/DELETE | Single-record ops (+ archive/restore/versions) | Node |
| `/api/admin/<entity>/{bulk,export,import,reorder}` | POST | Batch operations | Node |
| `/api/admin/media/upload` + `/media/[id]/{crop,focal-point,optimize}` | POST | Media pipeline (`sharp`) | Node |
| `/api/admin/analytics` | POST | Event capture (public POST) | Node |

Auth is enforced by `src/middleware.ts`, which edge-verifies the `kos_admin_session` HMAC-JWT cookie for `/admin` and `/api/admin`, and sets `x-is-admin` to strip public chrome. RBAC lives in `src/lib/admin/rbac.ts`.

> **Not built:** contact form endpoint + email service (contact is a terminal UI), GitHub API integration.

### 6.1 API Contracts
- Every API route has a **Zod schema** for input validation.
- Responses follow a **consistent envelope**:
  ```ts
  { success: boolean; data?: T; error?: { code: string; message: string } }
  ```
- Errors use **HTTP status codes** correctly (400, 401, 403, 404, 500).

---

## 7. State Management

Kandarp OS intentionally avoids heavy state libraries. The state model is simple:

| State Type | Tool | Location |
|------------|------|----------|
| Server data | RSC + `cache()` | `src/services/` |
| Global UI state | React Context | `src/context/` |
| 3D scene state | R3F + Context | `src/3d/hooks/` |
| Form state | React Hook Form + Zod | Component-local |
| URL state | `useSearchParams` / `useRouter` | Route-level |

**No Redux. No Zustand. No Recoil.** Unless a documented need arises.

---

## 8. Styling Architecture

- **Tailwind CSS** is the primary styling system — utility-first, token-driven.
- **CSS Modules** are used for complex, component-scoped styles (e.g., 3D canvas wrappers).
- All design tokens (colors, spacing, typography) are defined in `tailwind.config.ts` and `src/styles/`.
- **No inline styles** except for dynamic, runtime-computed values (e.g., 3D transforms).

See [`design-system.md`](./design-system.md) for the full token specification.

---

## 9. Performance Architecture

### 9.1 Budgets
| Asset | Budget | Enforcement |
|------|--------|-------------|
| Initial JS | < 150 KB gzip | Bundle analyzer in CI |
| Initial CSS | < 30 KB gzip | PurgeCSS via Tailwind |
| LCP image | < 200 KB | Next/Image + AVIF/WebP |
| 3D scene | Lazy-loaded, < 2 MB total | Suspense + dynamic import |
| Fonts | < 100 KB | `next/font` + subset |

### 9.2 Techniques
- **Code splitting** via `next/dynamic` for 3D and below-the-fold sections.
- **Image optimization** via `next/image` with `AVIF`/`WebP`.
- **Font optimization** via `next/font` (no layout shift).
- **Prefetching** of likely-next routes via Next.js Link.
- **Edge caching** for static assets.

---

## 10. Security

| Concern | Mitigation |
|---------|-----------|
| XSS | React auto-escaping; no `dangerouslySetInnerHTML` without sanitization |
| CSRF | Same-site cookies + token for form POSTs |
| Input validation | Zod on every API route and form |
| Secrets | Server-only env vars; never prefixed `NEXT_PUBLIC_` unless needed client-side |
| Dependencies | `npm audit` in CI; Dependabot enabled |
| Rate limiting | Edge middleware on `/api/*` (future) |

---

## 11. Observability

- **Error tracking:** Sentry (planned) — captures client + server errors.
- **Analytics:** Privacy-respecting analytics (Plausible/Umami) — no cookies, no PII.
- **Performance:** Lighthouse CI runs on every PR.
- **Logging:** Structured logging in API routes (`pino`-style JSON).

---

## 12. Deployment

- **Platform:** Vercel (primary) — optimized for Next.js.
- **Environments:** `development`, `preview` (per-PR), `production`.
- **CI/CD:** GitHub → Vercel auto-deploy on `main`.
- **Rollback:** Vercel instant rollback to any prior deployment.

---

## 13. Architectural Decision Records (ADRs)

Significant decisions are recorded as ADRs in `docs/architecture/`. Each ADR follows:

```
# ADR-XXX: Title
- Status: Proposed | Accepted | Deprecated | Superseded
- Date: YYYY-MM-DD
- Context: ...
- Decision: ...
- Consequences: ...
```

---

## 14. Technology Decisions Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js App Router | RSC, file-based routing, edge runtime |
| Language | TypeScript | Type safety, DX, refactor confidence |
| Styling | Tailwind CSS | Utility-first, token-driven, small CSS |
| 3D | React Three Fiber | Declarative Three.js, React-native |
| Animation | Framer Motion | Spring physics, layout animations |
| Forms | React Hook Form + Zod | Performant, type-safe validation |
| Icons | Lucide React | Tree-shakeable, consistent |
| Deployment | Vercel | Next.js-native, edge, preview deploys |

---

_This architecture is a living document. When a decision changes, update this file and record the reasoning in an ADR._
