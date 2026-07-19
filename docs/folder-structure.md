# Folder Structure — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-18
> **Scope:** Post-refactor enterprise architecture

> **See also:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full layered
> architecture, and [`REFACTORING-REPORT.md`](./REFACTORING-REPORT.md) for the
> migration summary.

---

## 1. Purpose

This document is the **authoritative map** of the Kandarp OS directory layout. It defines what lives where, and the rules for placing new files. If a file is in the wrong place, the PR is blocked.

---

## 2. Top-Level Structure

```
Portfolio/
├── config/              # Build/tool configuration files
├── content/             # MDX blog posts (file-based CMS source)
├── docs/                # All project documentation
├── prisma/              # Prisma schema + migrations + seed
├── public/              # Static assets served as-is
├── scripts/
│   └── refactor/        # Phase 1-5 migration scripts (PowerShell)
├── src/                 # All application source code
├── .env                 # Environment variables (gitignored)
├── .env.local           # Local environment overrides (gitignored)
├── .eslintrc.json       # ESLint config
├── .gitignore
├── .prettierrc          # Prettier config
├── next.config.mjs      # Next.js configuration
├── package.json
├── tailwind.config.ts   # Tailwind / design token config
├── tsconfig.json        # TypeScript config (path aliases)
├── vercel.json          # Vercel deployment config (headers, caching)
└── README.md            # Project entry (links to /docs)
```

---

## 3. The `src/` Directory

All application code lives under `src/`. Nothing executable lives at the project root except config. The `src/` tree is partitioned into **layers** and **feature modules**, wired together by TypeScript path aliases (see [`ARCHITECTURE.md` §4](./ARCHITECTURE.md#4-typescript-path-aliases)).

```
src/
├── app/                 # Next.js App Router (routing layer only)
├── backend/              # Layered server-side domain logic
├── features/             # Feature-based UI component modules
├── infrastructure/       # Cross-cutting infra: 3D engine, providers, styles
├── packages/             # Shared, barrel-exported internal packages
├── data/                 # Static content data (typed)
├── lib/                  # Feature-adjacent pure utilities (summaries)
├── services/             # App-level service integrations
├── assets/               # Fonts, images bundled by Next.js
└── middleware.ts         # Edge middleware (rate limit, CSRF, auth gate)
```

---

## 4. Directory Contracts

### 4.1 `src/app/` — Next.js App Router

The routing layer. **Only routing concerns live here.** No business logic.

```
src/app/
├── layout.tsx              # Root layout (providers, fonts, metadata)
├── page.tsx                # Home route (/)
├── globals.css             # Global styles + token CSS variables
├── not-found.tsx           # 404 page
├── error.tsx               # Root error boundary
├── loading.tsx             # Root loading UI
├── manifest.ts             # PWA manifest
├── robots.ts               # robots.txt
├── sitemap.ts              # sitemap.xml
├── icon.svg                # Favicon
├── (public)/               # Route group: public portfolio (no URL impact)
│   ├── about/
│   ├── background-preview/
│   ├── blog/               # page.tsx, [slug]/page.tsx, tags/...
│   ├── cloud-infinity-preview/
│   ├── contact/
│   ├── experience/
│   ├── infrastructure/
│   ├── projects/
│   └── skills/
├── admin/                  # Admin console (auth-gated)
│   ├── layout.tsx
│   └── (console)/          # ~30 management pages
└── api/                    # REST API (Route Handlers)
    └── admin/              # ~150 handlers (CRUD, auth, media, etc.)
```

**Rules:**
- Each route folder contains a `page.tsx`. Optionally: `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Route groups `(name)` are for **organization without URL impact**.
- Pages are **thin** — they compose feature components, they don't contain logic.
- API routes contain **only** request handling; logic lives in `@backend/*`.

---

### 4.2 `src/backend/` — Layered Server-Side Domain Logic

The server-side domain logic, organized in strict layers. Dependencies flow
**downward only**. See [`ARCHITECTURE.md` §5](./ARCHITECTURE.md#5-backend-layering)
for the full layering diagram and request flow.

```
src/backend/
├── database/              # Prisma client + connection management
├── logging/               # Pino structured logger
├── config/                # Env schema (Zod) + env accessors
├── auth/                  # Argon2 password hashing, session, JWT
├── permissions/           # RBAC (roles + permissions matrix)
├── repositories/          # Data access (repo interface + Prisma impl)
├── controllers/           # CRUD factory + config controllers
├── schemas/               # Zod validation schemas + DTO types
├── middlewares/           # API helpers, request context, logging wrapper
├── cache/                 # Revalidation / cache invalidation
├── storage/               # Cloudinary media storage adapter
└── services/              # Domain services (image opt, seed, public-data, store)
```

**Rules:**
- A lower layer **never** imports from a higher one.
- Controllers depend on the repository **interface**, not the Prisma implementation.
- Every state-changing operation is audit-logged at the repository layer.
- Env access goes through `@backend/config/env` (Zod-validated at startup).

---

### 4.3 `src/features/` — Feature-Based UI Components

UI components organized by **feature**, not by type. Each feature owns its
components in `<feature>/components/`. See [`ARCHITECTURE.md` §6](./ARCHITECTURE.md#6-feature-based-frontend)
for the feature inventory.

```
src/features/
├── hero/                  # Hero section (terminal, portrait, scroll indicator)
├── about/                 # About page (achievements grid, terminal)
├── projects/              # Projects page (container fleet, inspect)
├── experience/            # Experience timeline, deployment cards
├── skills/                # Skills mesh
├── infrastructure/        # Infrastructure topology, node inspect
├── blog/                  # Blog components (journal, TOC, MDX, pager)
├── contact/               # Contact form
├── navigation/            # Navbar, mobile menu, breadcrumbs
├── footer/                # Footer, social links
├── background/            # Cloud-infinity 3D background, page background
├── layout/                # App shell, container, section, page container
├── shared/                # Cross-feature (page header, responsive image)
└── admin/                 # Admin console UI components
    └── components/        # Each feature: <feature>/components/*.tsx
```

**Rules:**
- One component per file, `PascalCase.tsx`.
- Import via `@features/<feature>/components/<Component>`.
- Cross-feature imports go through `@features/shared/` or `@packages/ui/`.
- No business logic in components — only presentation + local UI state.

---

### 4.4 `src/infrastructure/` — Cross-Cutting Infrastructure

```
src/infrastructure/
├── three/                 # 3D / WebGL engine (R3F) — alias: @3d/*
│   ├── Avatar/            #   3D coder avatar
│   ├── cloudInfinity/     #   DevOps infinity loop background
│   ├── coderModel/         #   Legacy coder scene
│   ├── scenes/            #   Scene3D, SceneFallback
│   ├── hooks/             #   useCamera, useMouse, useReducedMotion, etc.
│   ├── Canvas3D.tsx        #   Reusable R3F canvas
│   └── ...                #   CameraRig, LightingRig, PostProcessing, etc.
├── providers/             # Client providers — alias: @providers / @providers/*
│   ├── index.tsx          #   Composed <Providers> tree
│   ├── AnimationProvider.tsx
│   └── ThreeProvider.tsx
└── styles/                # Global CSS — alias: @styles/*
    ├── tokens.css         #   Design tokens (dark-only palette)
    ├── admin-tokens.css   #   Admin console token overrides
    └── devops-background.css
```

**Rules:**
- All 3D components are **Client Components** (`"use client"`).
- 3D scenes are **always** dynamically imported with `{ ssr: false }`.
- Every scene has a 2D fallback.
- Heavy assets (models, textures) live in `public/`, not inline.

---

### 4.5 `src/packages/` — Shared Internal Packages

Cross-cutting shared code, barrel-exported. Each package has an `index.ts`
re-exporting its public API. See [`ARCHITECTURE.md` §7](./ARCHITECTURE.md#7-shared-packages).

```
src/packages/
├── types/                 # Shared TypeScript types — alias: @packages/types/*
├── utils/                 # Pure utilities (cn, constants, navigation) — @utils/*
├── config/                # Site config (identity, nav, presentation) — @config/*
├── hooks/                 # Shared React hooks — @hooks/*
└── ui/                    # UI primitives (Button, Card, Modal, etc.) — @packages/ui/*
```

**Rules:**
- **Pure functions only** in `utils/` — no side effects, no React, no DOM.
- One hook per file in `hooks/`, `camelCase.ts`, prefixed with `use`.
- 3D-specific hooks live in `@3d/hooks/`, not here.
- UI primitives are presentational only — no business logic.

---

### 4.6 `src/data/`, `src/lib/`, `src/services/`, `src/assets/`

The **only** place that fetches external data.

```
src/services/
├── projects.ts        # Fetch/parse project data
├── github.ts          # GitHub API integration
├── contact.ts         # Contact form submission handler
└── email.ts           # Email sending (server-only)
```

**Rules:**
- Services return **validated, typed** data (Zod-parsed).
- Services never return raw API responses.
- Services are **server-only** — never imported by Client Components.
- Components receive data as props; they never call services directly.

---

### 4.7 `src/data/` — Static Data

Typed, structured content that lives in the repo.

```
src/data/
├── projects.ts        # Project records
├── experience.ts      # Work history
├── skills.ts          # Skill categories
├── socials.ts         # Social links
├── navigation.ts      # Nav structure
└── site.ts            # Site metadata (name, title, description)
```

**Rules:**
- All data is **typed** via schemas in `src/types/`.
- Data files export typed constants, not raw objects.
- This is the source of truth for content until a CMS is introduced.

---

### 4.8 `src/types/` — TypeScript Types & Zod Schemas

```
src/types/
├── project.ts         # Project type + Zod schema
├── experience.ts
├── skill.ts
├── contact.ts
├── api.ts             # API response envelopes
└── index.ts           # Re-exports
```

**Rules:**
- **Zod schema is the source of truth.** Types are inferred: `type Project = z.infer<typeof projectSchema>`.
- No `any`. No `unknown` without a narrowing guard.
- Types are shared across server and client (no server-only secrets here).

---

### 4.9 `src/styles/` — Global Styles & Tokens

```
src/styles/
├── tokens.css         # CSS custom properties (design tokens)
└── globals.css        # (or lives in app/) Tailwind directives + base
```

**Rules:**
- Design tokens live in `tokens.css` as CSS custom properties.
- Tailwind config maps these variables to utilities.
- No component-specific styles here — those use Tailwind or CSS Modules.

---

### 4.10 `src/assets/` — Imported Assets

Assets that are **imported** into components (processed by the bundler).

```
src/assets/
├── images/            # SVG/PNG imported in components
├── icons/             # Custom SVG icons (not from Lucide)
├── fonts/             # Self-hosted fonts (if not using next/font)
├── textures/          # 3D textures
└── models/            # 3D model source files (if imported)
```

**Rules:**
- Distinguish from `public/`: `public/` is served as-is by URL; `src/assets/` is imported and bundled.
- Prefer `public/` for large files referenced by URL.
- Prefer `src/assets/` for icons/SVGs imported as React components.

---

### 4.11 `src/providers/` — Client Providers

Client-side context providers composed in the root layout.

```
src/providers/
├── ThemeProvider.tsx
├── MotionProvider.tsx
└── index.tsx          # Composes all providers
```

**Rules:**
- All files are Client Components.
- The root `layout.tsx` wraps children in the composed provider tree.
- Providers are **thin** — they provide context, not logic.

---

### 4.12 `src/context/` — Context Definitions

```
src/context/
├── theme-context.ts   # Theme context + hook
└── ui-context.ts      # Global UI state (nav open, etc.)
```

**Rules:**
- Context is defined here; the **provider component** lives in `src/providers/`.
- Context value types are explicitly defined.
- Hooks to consume context live here or in `src/hooks/`.

---

### 4.13 `src/lib/` — Third-Party Integration Config

```
src/lib/
├── analytics.ts       # Analytics client init
└── sentry.ts          # Error tracking config
```

**Rules:**
- Configuration and initialization of external libraries.
- Not for business logic (that's `src/services/`).
- Not for utilities (that's `src/utils/`).

---

## 5. The `public/` Directory

Static files served at the root URL.

```
public/
├── images/            # Optimized images referenced by URL
├── models/            # 3D models (GLB/GLTF) loaded at runtime
├── textures/          # 3D textures loaded at runtime
├── icons/             # Favicon, social icons
├── favicon.ico
├── robots.txt
└── sitemap.xml        # (or generated by Next.js)
```

**Rules:**
- Files here are **not processed** by the bundler.
- Referenced by absolute path: `/images/hero.jpg`.
- Large 3D assets go here (loaded via `useGLTF` at runtime).

---

## 6. The `docs/` Directory

All documentation. See [`README.md`](./README.md) for the index.

```
docs/
├── README.md
├── vision.md
├── architecture.md
├── roadmap.md
├── design-system.md
├── component-rules.md
├── folder-structure.md
├── coding-standards.md
├── vision/            # Vision artifacts
├── architecture/      # ADRs, diagrams
├── design/            # Design references, mockups
├── api/               # API contracts
├── resume/            # Resume content
└── goals/             # Goal tracking
```

---

## 7. The `config/` Directory

Build and tool configuration that doesn't belong at the root.

```
config/
├── lighthouse.json    # Lighthouse CI config
├── commitlint.json    # Commit message rules
└── husky/             # Git hooks
```

---

## 8. Path Aliases

Configured in `tsconfig.json` and `next.config.mjs`:

| Alias | Resolves To |
|-------|-------------|
| `@/` | `src/` |
| `@components/` | `src/components/` |
| `@hooks/` | `src/hooks/` |
| `@utils/` | `src/utils/` |
| `@services/` | `src/services/` |
| `@data/` | `src/data/` |
| `@types/` | `src/types/` |
| `@styles/` | `src/styles/` |
| `@assets/` | `src/assets/` |
| `@providers/` | `src/providers/` |
| `@context/` | `src/context/` |
| `@3d/` | `src/3d/` |
| `@lib/` | `src/lib/` |

**Rule:** Always use aliases. Never use relative paths deeper than one level (`../`).

---

## 9. File Placement Decision Tree

When adding a new file, ask:

```
Is it a route/page?
  → src/app/

Is it a React component?
  → src/components/<category>/

Is it a 3D element?
  → src/3d/<subsystem>/

Is it a React hook?
  → src/hooks/  (or src/3d/hooks/ if 3D-specific)

Is it a pure function?
  → src/utils/

Does it fetch external data?
  → src/services/

Is it static content/data?
  → src/data/

Is it a type or schema?
  → src/types/

Is it a context provider?
  → src/providers/  (context def → src/context/)

Is it a global style/token?
  → src/styles/

Is it a bundled asset (icon/svg)?
  → src/assets/

Is it a large static file (model/image by URL)?
  → public/

Is it documentation?
  → docs/

Is it tool config?
  → config/  (or root if conventional)
```

---

## 10. Naming Summary

| Item | Convention | Example |
|------|-----------|---------|
| Directories | `kebab-case` or `camelCase` (see rules) | `components/`, `3d/` |
| Component files | `PascalCase.tsx` | `ProjectCard.tsx` |
| Hook files | `camelCase.ts` | `useTheme.ts` |
| Util files | `camelCase.ts` or `kebab-case.ts` | `formatDate.ts` |
| Type files | `kebab-case.ts` | `project.ts` |
| Data files | `camelCase.ts` | `projects.ts` |
| Service files | `camelCase.ts` | `github.ts` |
| Test files | `<name>.test.ts(x)` | `ProjectCard.test.tsx` |
| Config files | `kebab-case` or conventional | `tailwind.config.ts` |

---

## 11. Rules Summary

1. **`src/` is sacred.** All app code lives there.
2. **One concern per folder.** Don't mix categories.
3. **Pages are thin.** Logic lives in services/hooks/utils.
4. **Services are the data gateway.** Nothing else fetches.
5. **Types are inferred from Zod.** Single source of truth.
6. **Aliases, not deep relative paths.**
7. **Co-locate tests** with their subject.
8. **`public/` for URL-served, `src/assets/` for imported.**
9. **3D is isolated** in `src/3d/`.
10. **When in doubt, check this document.**

---

_This structure is the skeleton of the system. Every file has a home. If you can't find the home, the structure is wrong — fix the structure, not the placement._
