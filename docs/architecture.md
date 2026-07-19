# Architecture — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-18
> **Scope:** Post-refactor enterprise architecture (pragmatic in-app monorepo)

---

## 1. Overview

Kandarp OS is a **single Next.js 15 application** that serves three surfaces from one
codebase, one build, and one deployment:

| Surface | Route prefix | Description |
|---------|-------------|-------------|
| **Public portfolio** | `/`, `/about`, `/projects`, `/experience`, `/skills`, `/infrastructure`, `/blog`, `/contact` | The marketing site + journal. SSR/SSG, public read-only. |
| **Admin console** | `/admin/*` | ~30 management modules (projects, blog, media, users, roles, settings, SEO, theme, etc.). Auth-gated, session-based. |
| **REST API** | `/api/admin/*` | ~150 Route Handlers backing the admin console. CRUD factory + RBAC + audit log. Auth-gated, rate-limited, CSRF-protected. |

The codebase is organized as a **pragmatic in-app monorepo**: a single Next.js app
whose `src/` is partitioned into clearly-bounded layers and feature modules, connected
by TypeScript path aliases. There is one `package.json`, one `tsconfig.json`, one build,
and one deployment — but the internal structure enforces the same separation a
multi-package monorepo would.

---

## 2. High-Level Directory Map

```
Portfolio/
├── config/                 # Build/tool configuration
├── content/                # MDX blog posts (file-based CMS source)
├── docs/                    # All project documentation
├── prisma/                  # Prisma schema + migrations + seed
├── public/                  # Static assets served as-is
├── scripts/
│   └── refactor/            # Phase 1-5 migration scripts (PowerShell)
├── src/                     # All application source code
│   ├── app/                 # Next.js App Router (routing layer only)
│   ├── backend/             # Layered server-side domain logic
│   ├── features/            # Feature-based UI component modules
│   ├── infrastructure/      # Cross-cutting infra: 3D engine, providers, styles
│   ├── packages/            # Shared, barrel-exported internal packages
│   ├── data/                # Static content data (typed)
│   ├── lib/                 # Feature-adjacent pure utilities (summaries)
│   ├── services/            # App-level service integrations
│   ├── assets/              # Fonts, images bundled by Next.js
│   └── middleware.ts        # Edge middleware (rate limit, CSRF, auth gate)
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 3. The `src/` Layer Model

```
src/
├── app/                     # ── Routing layer (thin) ──────────────────
│   ├── layout.tsx           #   Root layout (providers, fonts, metadata)
│   ├── page.tsx             #   Home route (/)
│   ├── globals.css          #   Global styles + token CSS variables
│   ├── error.tsx             #   Root error boundary
│   ├── loading.tsx          #   Root loading UI
│   ├── not-found.tsx        #   404 page
│   ├── manifest.ts          #   PWA manifest
│   ├── robots.ts            #   robots.txt
│   ├── sitemap.ts           #   sitemap.xml
│   ├── icon.svg             #   Favicon
│   ├── (public)/            #   Public portfolio route group
│   │   ├── about/
│   │   ├── background-preview/
│   │   ├── blog/             #   page.tsx, [slug]/page.tsx, tags/...
│   │   ├── cloud-infinity-preview/
│   │   ├── contact/
│   │   ├── experience/
│   │   ├── infrastructure/
│   │   ├── projects/
│   │   └── skills/
│   ├── admin/               #   Admin console (auth-gated)
│   │   ├── layout.tsx
│   │   └── (console)/       #     ~30 management pages
│   └── api/                 #   REST API (Route Handlers)
│       └── admin/           #     ~150 handlers (CRUD, auth, media, etc.)
│
├── backend/                 # ── Layered server-side domain logic ─────
│   ├── database/             #   Prisma client + connection management
│   ├── logging/              #   Pino structured logger
│   ├── config/               #   Env schema (Zod) + env accessors
│   ├── auth/                 #   Argon2 password hashing, session, JWT
│   ├── permissions/          #   RBAC (roles + permissions matrix)
│   ├── repositories/         #   Data access (repo + Prisma implementation)
│   ├── controllers/          #   CRUD factory + config controllers
│   ├── schemas/              #   Zod validation schemas + DTO types
│   ├── middlewares/          #   API helpers, request context, logging wrapper
│   ├── cache/                #   Revalidation / cache invalidation
│   ├── storage/              #   Cloudinary media storage adapter
│   └── services/             #   Domain services (image opt, seed, public-data, store)
│
├── features/                # ── Feature-based UI modules ──────────────
│   ├── hero/                 #   Hero section (terminal, portrait, scroll indicator)
│   ├── about/                #   About page (achievements grid, terminal)
│   ├── projects/             #   Projects page (container fleet, inspect)
│   ├── experience/           #   Experience timeline, deployment cards
│   ├── skills/               #   Skills mesh
│   ├── infrastructure/       #   Infrastructure topology, node inspect
│   ├── blog/                 #   Blog components (journal, TOC, MDX, pager)
│   ├── contact/              #   Contact form
│   ├── navigation/          #   Navbar, mobile menu, breadcrumbs
│   ├── footer/               #   Footer, social links
│   ├── background/           #   Cloud-infinity 3D background, page background
│   ├── layout/               #   App shell, container, section, page container
│   ├── shared/               #   Cross-feature shared (page header, responsive image)
│   └── admin/                #   Admin console UI components
│       └── components/      #     Each feature: <feature>/components/*.tsx
│
├── infrastructure/          # ── Cross-cutting infrastructure ──────────
│   ├── three/                #   3D / WebGL engine (R3F scenes, hooks, materials)
│   │   ├── Avatar/           #     3D coder avatar
│   │   ├── cloudInfinity/    #     DevOps infinity loop background
│   │   ├── coderModel/        #     Coder scene (legacy 3D figure)
│   │   ├── scenes/            #     Scene3D, SceneFallback
│   │   ├── hooks/             #     useCamera, useMouse, useReducedMotion, etc.
│   │   ├── Canvas3D.tsx       #     Reusable R3F canvas
│   │   └── ...                #     CameraRig, LightingRig, PostProcessing, etc.
│   ├── providers/            #   Client providers (Animation, Three)
│   │   └── index.tsx         #     Composed <Providers> tree
│   └── styles/               #   Global CSS (tokens, admin tokens, devops background)
│
├── packages/                # ── Shared internal packages (barrel-exported) ─
│   ├── types/                #   Shared TypeScript types (about, blog, projects, etc.)
│   ├── utils/                #   Pure utilities (cn, constants, navigation)
│   ├── config/               #   Site config (identity, navigation, presentation)
│   ├── hooks/                #   Shared React hooks (useTerminal, useSiteConfig, etc.)
│   └── ui/                   #   UI primitives (Button, Card, Modal, Input, etc.)
│
├── data/                     # ── Static content data (typed) ───────────
│   ├── about.ts, projects.ts, experience.ts, skills.ts, ...
│
├── lib/                      # ── Feature-adjacent pure utilities ──────
│   ├── blog.ts, blogSummary.ts, projectsSummary.ts, ...
│
├── services/                 # ── App-level service integrations ──────
│
├── assets/                   # ── Fonts, images bundled by Next.js ────
│   └── fonts.ts
│
└── middleware.ts             # ── Edge middleware ─────────────────────
```

---

## 4. TypeScript Path Aliases

The layers are wired together by path aliases defined in [`tsconfig.json`](../tsconfig.json).
These are the **canonical import paths** — always prefer the dedicated alias over `@/*`.

| Alias | Resolves to | Used for |
|------|-------------|----------|
| `@backend/*` | `./src/backend/*` | Server-side domain logic (auth, repos, controllers, services) |
| `@features/*` | `./src/features/*` | Feature UI components |
| `@packages/*` | `./src/packages/*` | Shared packages (barrel imports) |
| `@config/*` | `./src/packages/config/*` | Site config |
| `@hooks/*` | `./src/packages/hooks/*` | Shared React hooks |
| `@utils/*` | `./src/packages/utils/*` | Pure utilities |
| `@3d/*` | `./src/infrastructure/three/*` | 3D engine (scenes, hooks, materials) |
| `@providers` | `./src/infrastructure/providers/index.tsx` | Composed provider tree (barrel) |
| `@providers/*` | `./src/infrastructure/providers/*` | Individual providers |
| `@styles/*` | `./src/infrastructure/styles/*` | Global CSS |
| `@services/*` | `./src/services/*` | App-level service integrations |
| `@data/*` | `./src/data/*` | Static content data |
| `@assets/*` | `./src/assets/*` | Bundled assets (fonts) |
| `@lib/*` | `./src/lib/*` | Feature-adjacent utilities |
| `@/*` | `./src/*` | Catch-all (avoid for aliased paths) |

> **⚠️ Alias gotchas (learned during refactor):**
> 1. **Longest-prefix matching:** `@/*` shadows `@<pkg>/*` for imports written as
>    `@/<pkg>/...`. Always use the canonical alias (e.g. `@utils/cn`, not `@/utils/cn`).
> 2. **`@types/*` is reserved:** TypeScript reserves `@types/<name>` for ambient
>    declaration packages (TS6137). Never use `@types/*` as a path alias — use
>    `@packages/types/*` instead.
> 3. **Bare barrel imports:** `@providers/*` only matches `@providers/<segment>`.
>    A bare `@providers` (no segment) needs a separate alias entry pointing to the
>    index file.

---

## 5. Backend Layering

The server-side domain logic in `src/backend/` follows a strict layered architecture.
Dependencies flow **downward only** — a lower layer never imports from a higher one.

```
┌─────────────────────────────────────────────────────────┐
│  Route Handlers (src/app/api/admin/*)                   │  ← thin: parse, authorize, respond
│  ┌───────────────────────────────────────────────────┐  │
│  │  Middlewares (backend/middlewares/)                │  │  ← request context, logging, API helpers
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Controllers (backend/controllers/)           │  │  │  ← CRUD factory, config handlers
│  │  │  ┌───────────────────────────────────────┐   │  │  │
│  │  │  │  Services (backend/services/)          │   │  │  │  ← image opt, seed, public-data, store
│  │  │  │  ┌─────────────────────────────────┐  │   │  │  │
│  │  │  │  │  Repositories (backend/repositories/)│  │   │  │  │  ← data access abstraction
│  │  │  │  │  ┌───────────────────────────┐  │  │   │  │  │
│  │  │  │  │  │  Database (backend/database/)│  │  │   │  │  │  ← Prisma client
│  │  │  │  │  └───────────────────────────┘  │  │   │  │  │
│  │  │  │  └───────────────────────────────┘   │  │  │
│  │  │  └───────────────────────────────────────┘   │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Cross-cutting:                                          │
│    auth/  permissions/  schemas/  config/  logging/      │
│    cache/  storage/                                      │
└─────────────────────────────────────────────────────────┘
```

### 5.1 Request flow (example: `PUT /api/admin/projects/[id]`)

1. **Route handler** (`src/app/api/admin/projects/[id]/route.ts`) — parses the
   request body, calls [`withLogging`](../src/backend/middlewares/with-logging.ts)
   + [`api()`](../src/backend/middlewares/api.ts) wrapper.
2. **`api()` middleware** — authenticates the session, checks RBAC permission
   (`projects:update`), injects the request context.
3. **Controller** — [`createCrudHandlers`](../src/backend/controllers/crud.ts)
   validates the body against a Zod schema, delegates to the repository.
4. **Repository** — [`repo-prisma.ts`](../src/backend/repositories/repo-prisma.ts)
   translates the domain operation into a Prisma call (with soft-delete, audit log).
5. **Database** — [`db.ts`](../src/backend/database/db.ts) holds the singleton
   `PrismaClient`.
6. **Response** — the controller returns a typed DTO; the middleware serializes
   and logs.

### 5.2 CRUD factory

Most admin resources share the same shape (list, get, create, update, archive,
restore, restore-version, reorder, bulk, export, import). The
[`createCrudHandlers`](../src/backend/controllers/crud.ts) factory wires a
resource to its repository + Zod schema + RBAC permission + audit log in one
call, so each route handler is 3-5 lines.

---

## 6. Feature-Based Frontend

UI components are organized by **feature**, not by type. Each feature owns its
components in `src/features/<feature>/components/`.

| Feature | Owns | Key components |
|---------|------|----------------|
| `hero` | Hero section | HeroSection, HeroTerminal, HeroPortrait, HeroBackground, HeroScrollIndicator, BootScreen |
| `about` | About page | AchievementsGrid, AboutTerminal |
| `projects` | Projects page | ContainerFleet, ContainerRow, ContainerInspect |
| `experience` | Experience page | ExperienceTimeline, DeploymentCard |
| `skills` | Skills page | SkillsMesh |
| `infrastructure` | Infrastructure page | InfrastructureTopology, NodeInspect |
| `blog` | Blog | JournalEntry, JournalStream, TableOfContents, ReadingProgress, MdxContent, PostPager |
| `contact` | Contact page | ContactForm |
| `navigation` | Site nav | Navbar, MobileMenu, Breadcrumbs |
| `footer` | Footer | Footer, SocialLinks, FooterBottom |
| `background` | Global background | CloudInfinityBackground, PageBackground |
| `layout` | Layout primitives | AppShell, Container, Section, PageContainer, NavigationLayout |
| `shared` | Cross-feature | PageHeader, ResponsiveImage, StatPills, ThemeTokens, AnalyticsBeacon |
| `admin` | Admin console | Admin-specific UI components |

**Rules:**
- One component per file, `PascalCase.tsx`.
- Components import from `@features/<feature>/components/<Component>` or via barrel.
- Cross-feature imports go through `@features/shared/` or `@packages/ui/`.
- No business logic in components — only presentation + local UI state.

---

## 7. Shared Packages

Cross-cutting shared code lives in `src/packages/*` as barrel-exported internal
packages. Each has an `index.ts` that re-exports its public API.

| Package | Barrel | Contents |
|---------|--------|----------|
| `types` | `@packages/types` | Shared TypeScript interfaces (about, blog, projects, experience, skills, infrastructure, contact, achievements) |
| `utils` | `@utils/*` | `cn` (className merge), `constants` (SITE, SECTIONS), `navigation` (scrollToSection) |
| `config` | `@config/*` | `site` (site identity, navigation, presentation config) |
| `hooks` | `@hooks/*` | `useTerminal`, `useHeroTerminal`, `useAboutTerminal`, `useSiteConfig`, `useAnalyticsBeacon`, `useTimerQueue` |
| `ui` | `@packages/ui/*` | Primitives: Button, Card, GlassCard, Badge, Heading, Input, Textarea, Modal, Popover, Tooltip, Avatar |

---

## 8. Infrastructure

### 8.1 3D Engine (`src/infrastructure/three/`)

The 3D subsystem is isolated under `@3d/*` so it can be evolved or replaced
without touching the rest of the app.

- **`Canvas3D`** — reusable R3F `<Canvas>` wrapper (camera, lighting, post-processing).
- **Scenes** — `Avatar/` (3D coder figure), `cloudInfinity/` (DevOps infinity loop),
  `coderModel/` (legacy coder scene), `scenes/Scene3D` + `SceneFallback`.
- **Hooks** — `useCamera`, `useMouse`, `useReducedMotion`, `useDeviceTier`,
  `useIsDesktop`, `useRaycaster`.
- **Rigs** — `CameraRig`, `LightingRig`, `Environment3D`, `PostProcessing`,
  `PerformanceMonitor`.

**Rules:**
- All 3D components are **Client Components** (`"use client"`).
- 3D scenes are **always** dynamically imported with `{ ssr: false }`.
- Every scene has a 2D fallback (`SceneFallback` / `CoderFallback`).
- Heavy assets (models, textures) live in `public/`, not inline.

### 8.2 Providers (`src/infrastructure/providers/`)

The composed `<Providers>` tree is mounted once in the root layout. Order matters:
1. **AnimationProvider** — Lenis + GSAP scroll-linked motion.
2. **ThreeProvider** — 3D progressive enhancement (depends on animation ready).

### 8.3 Styles (`src/infrastructure/styles/`)

- `tokens.css` — design tokens (CSS custom properties, dark-only palette).
- `admin-tokens.css` — admin console token overrides.
- `devops-background.css` — DevOps infinity loop background styles.

Imported by `src/app/globals.css` (`@import "../infrastructure/styles/tokens.css"`)
and `src/app/admin/layout.tsx` (`@styles/admin-tokens.css`).

---

## 9. Routing

### 9.1 Public routes — `src/app/(public)/`

The `(public)` route group groups all public portfolio routes. Route groups
(parenthesized) do **not** affect the URL — `/about` stays `/about`.

```
src/app/(public)/
├── about/page.tsx
├── background-preview/page.tsx
├── blog/
│   ├── page.tsx
│   ├── [slug]/page.tsx
│   └── tags/
│       ├── page.tsx
│       └── [tag]/page.tsx
├── cloud-infinity-preview/page.tsx
├── contact/page.tsx
├── experience/page.tsx
├── infrastructure/page.tsx
├── projects/page.tsx
└── skills/page.tsx
```

### 9.2 Admin console — `src/app/admin/`

Auth-gated. The `admin/layout.tsx` enforces the session; `(console)/` holds the
~30 management pages.

### 9.3 REST API — `src/app/api/`

~150 Route Handlers under `api/admin/`. Each is thin: parse → authorize →
delegate to controller → respond. See [`docs/backend/api-reference.md`](backend/api-reference.md).

### 9.4 Root files

`layout.tsx`, `page.tsx` (home), `error.tsx`, `loading.tsx`, `not-found.tsx`,
`globals.css`, `manifest.ts`, `robots.ts`, `sitemap.ts`, `icon.svg` — all stay
at `src/app/` root (shared by all route groups).

---

## 10. Security Architecture

- **Edge middleware** (`src/middleware.ts`) — rate limiting, CSRF, body-size
  limits, auth gate for `/admin` and `/api/admin`.
- **Auth** (`@backend/auth/`) — Argon2 password hashing, session JWT, session
  service.
- **RBAC** (`@backend/permissions/rbac`) — roles + permissions matrix; every
  API handler checks a permission before acting.
- **Audit log** — every state-changing operation is logged via the repository
  layer.
- **CSP + security headers** — configured in [`next.config.mjs`](../next.config.mjs)
  and [`vercel.json`](../vercel.json).

See [`docs/backend/security.md`](backend/security.md) for the full security model.

---

## 11. Data Layer

- **Prisma** (`prisma/schema.prisma`) — PostgreSQL, RBAC tables, soft-delete
  pattern, audit log.
- **Repository pattern** (`@backend/repositories/`) — `repo.ts` defines the
  interface; `repo-prisma.ts` is the Prisma implementation. Controllers depend
  on the interface, not the implementation.
- **Static data** (`@data/*`) — typed static content (about, projects, experience,
  skills, navigation, socials, hero, infrastructure, achievements, blog).
- **File-based CMS** (`content/`) — MDX blog posts; `@lib/blog.ts` reads them.

See [`docs/backend/README.md`](backend/README.md) for the data model.

---

## 12. Build & Deployment

- **One build, one deployment** — the entire app (public + admin + API) builds
  and deploys as a single Next.js app.
- **Vercel** — configured via [`vercel.json`](../vercel.json) (security headers,
  caching).
- **Environment** — `.env` + `.env.local`; validated at startup by
  [`@backend/config/env-schema`](../src/backend/config/env-schema.ts) (Zod).

See [`docs/deployment-vercel.md`](deployment-vercel.md) for deployment details.

---

## 13. Migration Notes

This architecture is the result of a phased refactor from a flat `src/` layout
to the layered, feature-based structure documented above. The migration:

- **Preserved Git history** — all moves used `git mv`.
- **Preserved all functionality** — no features removed, no UI redesigned.
- **Kept typecheck at 0 errors** throughout every phase.
- **Used scripted, auditable phases** — see `scripts/refactor/phase{1-5}*.ps1`.

See [`docs/REFACTORING-REPORT.md`](REFACTORING-REPORT.md) for the full migration
report (what moved where, import changes, breaking changes, performance notes).
