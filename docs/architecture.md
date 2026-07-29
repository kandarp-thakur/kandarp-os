# Architecture — Kandarp OS (Phase 1, Frontend-Only)

> How the frontend-only Kandarp OS is structured, how data flows, and where the seams are for Phase 2.

## 1. Overview

Kandarp OS is a **single-page engineering portfolio** themed as a DevOps operating system. The visitor experiences one continuous scroll through themed sections (hero boot, `whoami`, deployments, containers, infrastructure, toolkit, achievements, logs, ssh) — each rendered as a reusable component with a stable anchor id.

Phase 1 is a **clean, standalone frontend**. There is no server runtime, no database, no API, no auth. All content is resolved at build/request time from typed, hardcoded seed files.

## 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  app/                     Next.js App Router (routes)        │
│  ├── layout.tsx           root layout (providers + chrome)   │
│  ├── page.tsx             home (single-page OS experience)   │
│  └── (public)/            secondary routes (blog, etc.)      │
├─────────────────────────────────────────────────────────────┤
│  features/                feature-sliced UI components        │
│  ├── hero/ about/ experience/ projects/ infrastructure/      │
│  ├── skills/ blog/ contact/ navigation/ footer/              │
│  ├── layout/ shared/ background/                             │
├─────────────────────────────────────────────────────────────┤
│  lib/                     frontend-only data + helpers        │
│  ├── public-data.ts       content accessors (the seam)       │
│  ├── site-types.ts        shared view-model types            │
│  ├── revalidate.ts        ISR tag registry (inert)           │
│  └── blog.ts              MDX content loader                 │
├─────────────────────────────────────────────────────────────┤
│  data/                    hardcoded content (source of truth) │
├─────────────────────────────────────────────────────────────┤
│  packages/                reusable primitives                 │
│  ├── ui/ hooks/ types/ utils/ config/                        │
├─────────────────────────────────────────────────────────────┤
│  infrastructure/          cross-cutting infra                 │
│  ├── three/ providers/ styles/                               │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

```
src/data/*.ts ──► src/lib/public-data.ts ──► app/page.tsx + (public)/* ──► features/*
```

1. **Content** is authored as typed, Zod-validated constants in [`src/data/`](../src/data/).
2. **Accessors** in [`src/lib/public-data.ts`](../src/lib/public-data.ts) (`getPublicProjects`, `getPublicSiteIdentity`, `getPublicMetadata`, …) read the seed data and return public view-models.
3. **Server components** (`app/page.tsx`, the `(public)` route group, `sitemap.ts`) call the accessors and pass data down as props.
4. **Feature components** are presentational — they receive typed props and render. No data fetching inside feature components.

## 4. The Backend Seam

The previous full-stack build read from a Prisma-backed JSON store via `@backend/services/public-data`. For Phase 1:

- The entire `src/backend/` directory was deleted.
- Three frontend-only shim modules were created in [`src/lib/`](../src/lib/): `public-data.ts`, `site-types.ts`, `revalidate.ts`.
- The `@backend/*` path aliases in [`tsconfig.json`](../tsconfig.json) now redirect to these shims:

  ```json
  "@backend/services/public-data": ["./src/lib/public-data.ts"],
  "@backend/schemas/types":        ["./src/lib/site-types.ts"],
  "@backend/cache/revalidate":     ["./src/lib/revalidate.ts"]
  ```

This means **no public component had to be edited** — every existing import resolves to the shim. The accessor signatures are identical to the previous implementation, so **Phase 2 can swap the shim bodies for a CMS-backed implementation without touching any consumer**.

## 5. Rendering Model

- **Server Components by default.** Pages and the root layout are async server components that resolve data at request time.
- **Client Components** (`"use client"`) are used only where interactivity is required (navbar, terminal typewriter, 3D canvas, command palette, mobile menu).
- **Static prerendering.** All 18 routes prerender as static content at build time (see the build output). Blog detail/tag pages use `generateStaticParams`.
- **ISR cache wrapper.** [`src/packages/hooks/useSiteConfig.ts`](../src/packages/hooks/useSiteConfig.ts) wraps the site identity in `unstable_cache` with the (now-inert) ISR tags from [`src/lib/revalidate.ts`](../src/lib/revalidate.ts).

## 6. Styling System

- **Tailwind CSS 3** with a custom design-token theme (see [`tailwind.config.ts`](../tailwind.config.ts)).
- **CSS custom properties** defined in [`src/infrastructure/styles/tokens.css`](../src/infrastructure/styles/tokens.css) drive colors, typography, spacing, shadows, radii, and animation timings.
- **Dark-only.** The site is dark-themed (the "OS" aesthetic); `data-theme="dark"` is set statically on `<html>` to avoid FOUC.
- See [`docs/design-system.md`](design-system.md) and [`docs/STYLE_GUIDE.md`](STYLE_GUIDE.md).

## 7. 3D / WebGL

- The signature **CloudInfinity** background and the **CoderModel** hero avatar are built with Three.js + @react-three/fiber + drei.
- A device-tier hook (`useDeviceTier`) scales fidelity (off / low / high) based on hardware + reduced-motion preference.
- All 3D is lazy-loaded and behind a `<Suspense>` fallback so it never blocks first paint.

## 8. Performance

- `optimizePackageImports` tree-shakes barrel exports (lucide, framer-motion, gsap).
- `removeConsole` strips logs in production (errors preserved).
- Source maps are not shipped to the browser.
- Static prerendering + gzip compression.
- First Load JS shared by all routes: ~103 kB.

## 9. What Was Removed (Phase 1)

- `src/backend/` (Prisma, auth, repositories, services, controllers, middleware, logging, storage)
- `src/app/admin/` (the entire admin console)
- `src/app/api/` (all API routes)
- `src/features/admin/` (admin UI components)
- `prisma/` (schema, migrations, seed)
- Docker (`Dockerfile`, `docker-compose*.yml`, `.dockerignore`)
- Nginx configs, deployment/infra shell scripts
- `src/middleware.ts` (admin auth gate)
- Backend-only dependencies (Prisma, next-auth, argon2, cloudinary, pino, sharp, nanoid, tsx, pino-pretty, @auth/prisma-adapter)

See [`CHANGELOG.md`](../CHANGELOG.md) for the full list.
