# Folder Structure — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

---

## 1. Purpose

This document is the **authoritative map** of the Kandarp OS directory layout. It defines what lives where, and the rules for placing new files. If a file is in the wrong place, the PR is blocked.

---

## 2. Top-Level Structure

```
Portfolio/
├── config/              # Build/tool configuration files
├── docs/                # All project documentation
├── public/              # Static assets served as-is
├── src/                 # All application source code
├── .env.example         # Environment variable template
├── .eslintrc.json       # ESLint config
├── .gitignore
├── .prettierrc          # Prettier config
├── next.config.mjs      # Next.js configuration
├── package.json
├── tailwind.config.ts   # Tailwind / design token config
├── tsconfig.json        # TypeScript config
└── README.md            # Project entry (links to /docs)
```

---

## 3. The `src/` Directory

All application code lives under `src/`. Nothing executable lives at the project root except config.

```
src/
├── 3d/
├── app/
├── assets/
├── components/
├── context/
├── data/
├── hooks/
├── lib/
├── providers/
├── services/
├── styles/
├── types/
└── utils/
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
├── (home)/                 # Route group: home-specific layout
├── (auth)/                 # Route group: auth pages (future)
├── (dashboard)/            # Route group: dashboard (future)
├── about/
│   └── page.tsx
├── projects/
│   ├── page.tsx            # Projects listing
│   └── [slug]/
│       └── page.tsx        # Project detail
├── experience/
│   └── page.tsx
├── skills/
│   └── page.tsx
├── contact/
│   └── page.tsx
├── blog/
│   ├── page.tsx
│   └── [slug]/
│       └── page.tsx
└── api/                    # API routes (Route Handlers)
    ├── auth/
    ├── contact/
    └── projects/
```

**Rules:**
- Each route folder contains a `page.tsx`. Optionally: `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Route groups `(name)` are for **organization without URL impact**.
- Pages are **thin** — they compose sections, they don't contain logic.
- API routes contain **only** request handling; logic lives in `src/services/`.

---

### 4.2 `src/components/` — React Components

Organized by role. See [`component-rules.md`](./component-rules.md) for the full contract.

```
src/components/
├── ui/            # Primitives: Button, Input, Badge, Card, Container
├── layout/        # Structural: Section, Grid, Stack
├── sections/      # Page sections: HeroSection, ProjectsSection
├── cards/         # Content cards: ProjectCard, ExperienceCard
├── forms/         # Forms: ContactForm, FormField
├── navigation/    # Nav: Navbar, MobileMenu, Breadcrumbs
├── header/        # Header region: Header, Logo
├── footer/        # Footer region: Footer, SocialLinks
├── shared/        # Cross-cutting: ThemeToggle, ScrollProgress
└── providers/     # Client providers: ThemeProvider, MotionProvider
```

**Rules:**
- One component per file, `PascalCase.tsx`.
- Co-located tests: `Component.test.tsx`.
- No business logic in components — only presentation + local UI state.

---

### 4.3 `src/3d/` — 3D / WebGL Layer

Isolated to keep the 3D subsystem modular and replaceable.

```
src/3d/
├── models/        # 3D model loaders & asset wrappers
├── scenes/        # Composed scenes: HeroScene, ProjectOrbScene
├── shaders/       # GLSL shaders (vertex/fragment)
├── materials/     # Reusable Three.js materials
├── animations/    # Animation rigs, timelines, clip configs
└── hooks/         # R3F-specific hooks: useFrame wrappers, useGLTF
```

**Rules:**
- All 3D components are **Client Components** (`"use client"`).
- 3D scenes are **always** dynamically imported with `{ ssr: false }`.
- Every scene has a 2D fallback.
- Heavy assets (models, textures) live in `public/` or `src/assets/`, not inline.

---

### 4.4 `src/hooks/` — Custom React Hooks

```
src/hooks/
├── useTheme.ts
├── useMediaQuery.ts
├── useScrollPosition.ts
└── useMounted.ts
```

**Rules:**
- One hook per file, `camelCase.ts`, prefixed with `use`.
- Hooks are **framework-agnostic** (no Next.js-specific imports unless necessary).
- 3D-specific hooks live in `src/3d/hooks/`, not here.
- Every hook has a co-located test.

---

### 4.5 `src/utils/` — Pure Utility Functions

```
src/utils/
├── cn.ts              # className merge utility
├── formatDate.ts
├── slugify.ts
├── debounce.ts
└── constants.ts       # App-wide constants
```

**Rules:**
- **Pure functions only.** No side effects, no React, no DOM access.
- One concern per file.
- Every function has a co-located test.
- If a function needs React, it's a hook, not a util.

---

### 4.6 `src/services/` — Data Access Layer

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
