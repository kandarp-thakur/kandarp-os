# Architecture — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

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
| `/` (home) | SSG + ISR (revalidate 1h) | Fast, SEO-critical, rarely changes |
| `/about` | SSG | Static content |
| `/projects` | SSG + ISR (revalidate 6h) | Updates when projects added |
| `/projects/[slug]` | SSG + `generateStaticParams` | Per-project SEO |
| `/experience` | SSG | Static timeline |
| `/skills` | SSG | Static list |
| `/contact` | SSR (dynamic) | Form + CSRF considerations |
| `/blog` | SSG + ISR | Content-driven |
| `/api/contact` | Edge runtime | Low-latency form handling |
| `/api/projects` | Node runtime | May need DB access later |

---

## 4. Data Flow

```
┌──────────────┐     Zod parse     ┌──────────────┐     import     ┌──────────────┐
│  Raw Source   │ ───────────────▶ │  Service Layer│ ─────────────▶ │  Component   │
│  (JSON/MDX)   │                  │  (validation) │                │  (RSC/CSR)   │
└──────────────┘                   └──────────────┘                └──────────────┘
```

### 4.1 Data Sources
- **Structured data** lives in `src/data/` as typed TypeScript/JSON modules.
- **Content** (if added later) lives as MDX in a content directory.
- **External data** (GitHub repos, etc.) is fetched via services in `src/services/`.

### 4.2 Service Layer
- Services in `src/services/` are the **only** modules allowed to fetch external data.
- They return **validated, typed** data — never raw responses.
- Components never call `fetch()` directly.

### 4.3 Client State
- Global UI state (theme, navigation, 3D state) lives in `src/context/`.
- Local component state uses `useState` / `useReducer`.
- Server state (cached data) uses React's built-in `cache()` and RSC data fetching — **no external data-fetching library** unless complexity demands it.

---

## 5. The 3D Subsystem

The 3D layer is isolated in `src/3d/` to keep it modular and replaceable.

```
src/3d/
├── models/       # 3D model assets & loaders
├── scenes/       # Composed scenes (e.g., HeroScene, ProjectOrbScene)
├── shaders/      # GLSL shaders (vertex/fragment)
├── materials/    # Reusable Three.js materials
├── animations/   # Animation rigs and timelines
└── hooks/        # R3F-specific hooks (useFrame wrappers, etc.)
```

### 5.1 Performance Contract
- 3D assets are **GLTF/GLB** with Draco compression.
- Textures are **WebP/KTX2** — never uncompressed PNGs in 3D.
- The 3D canvas mounts **only after** the page is interactive (post-LCP).
- A `prefers-reduced-motion` check disables heavy 3D and falls back to static imagery.

### 5.2 Fallback Strategy
- Every 3D scene has a **2D fallback** (image or CSS animation).
- Feature detection (`WebGL` support) determines which renders.
- No visitor is blocked from content by a missing GPU.

---

## 6. API Layer

API routes live in `src/app/api/` and follow RESTful conventions.

| Endpoint | Method | Purpose | Runtime |
|----------|--------|---------|---------|
| `/api/contact` | POST | Handle contact form | Edge |
| `/api/auth/*` | GET/POST | Auth callbacks (future) | Node |
| `/api/projects` | GET | List projects (future CMS) | Node |

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
