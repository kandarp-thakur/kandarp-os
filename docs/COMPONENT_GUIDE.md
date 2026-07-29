# Component Guide — Kandarp OS (Phase 1)

How components are organised, the contracts they follow, and how to build new ones.

## 1. Organisation

Components live in **`src/features/<domain>/components/`** (feature-specific) and **`src/packages/ui/`** (generic primitives). The split is intentional:

- **`features/`** — components tied to a domain (hero, projects, blog…). May import from `data/`, `lib/`, `packages/`.
- **`packages/ui/`** — domain-agnostic primitives (`Button`, `Card`, `GlassCard`, `Badge`, `Modal`, `Input`, `Heading`, `Tooltip`, `Popover`). No domain imports.

## 2. Server vs Client Components

- **Default: Server Components.** Pages, layout, and most sections are async server components that resolve data and pass it down as props.
- **Client Components** (`"use client"`) are used only for interactivity:
  - [`Navbar`](../src/features/navigation/components/Navbar.tsx) (scroll-spy, mobile menu, command palette)
  - [`HeroTerminal`](../src/features/hero/components/HeroTerminal.tsx) / [`BootScreen`](../src/features/hero/components/BootScreen.tsx) (typewriter)
  - [`CommandPalette`](../src/features/shared/components/CommandPalette.tsx)
  - All 3D scenes (R3F requires client)
  - [`MobileMenu`](../src/features/navigation/components/MobileMenu.tsx)

## 3. Component Contracts

Every feature component:

1. **Receives typed props** — no data fetching inside feature components. Data is resolved in the page/server component and passed down.
2. **Is presentational** — rendering only; side effects live in hooks.
3. **Uses the `cn()` helper** ([`src/packages/utils/cn.ts`](../src/packages/utils/cn.ts)) for conditional classes.
4. **Accepts a `className` escape hatch** where it makes sense.
5. **Stays under ~300 lines.** Split larger components into sub-components in the same folder.

## 4. Layout Primitives

From [`src/features/layout/components/`](../src/features/layout/components/):

| Component       | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `AppShell`      | Wraps the page with navbar + footer + skip-nav.      |
| `Section`       | Semantic `<section>` with anchor id + spacing scale. |
| `Container`     | Max-width wrapper (`narrow` / `default` / `wide`).   |
| `PageContainer` | Page-level container for secondary routes.           |
| `ContentWrapper`| Inner content alignment.                             |

## 5. Shared Presentational Components

From [`src/features/shared/components/`](../src/features/shared/components/):

| Component         | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `PageHeader`      | Eyebrow + title + subtitle block.              |
| `StatPills`       | Row of key/label/value stat pills.             |
| `TerminalLineView`| A single rendered terminal line.               |
| `CopyButton`      | Copy-to-clipboard with feedback.               |
| `ResponsiveImage` | `<picture>` with variants + blur placeholder.  |
| `ThemeTokens`     | Injects CMS-driven design tokens (inert now).  |
| `AnalyticsBeacon` | Invisible client component (beacon hook).      |

## 6. UI Primitives

From [`src/packages/ui/`](../src/packages/ui/): `Button`, `Card`, `GlassCard`, `Badge`, `Avatar`, `Heading`, `Input`, `Textarea`, `Modal`, `Popover`, `Tooltip`. All use `class-variance-authority` for variants and `cn()` for merging.

## 7. Hooks

Reusable hooks live in [`src/packages/hooks/`](../src/packages/hooks/):

| Hook               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `useTerminal`      | Generic typewriter terminal engine.                  |
| `useHeroTerminal`  | Hero-specific terminal sequence.                     |
| `useAboutTerminal` | About-specific terminal sequence.                    |
| `useTimerQueue`    | Queued timed callbacks (for boot/typing sequences).  |
| `useSiteConfig`    | ISR-cached site identity (server).                   |
| `useAnalyticsBeacon`| Client analytics beacon.                            |

3D-specific hooks live in [`src/infrastructure/three/hooks/`](../src/infrastructure/three/hooks/): `useDeviceTier`, `useMouse`, `useReducedMotion`, `useCamera`, `useRaycaster`, `useIsDesktop`.

## 8. Adding a New Section

1. Add the content to [`src/data/`](../src/data/) with a Zod schema in [`src/packages/types/`](../src/packages/types/).
2. Add an accessor in [`src/lib/public-data.ts`](../src/lib/public-data.ts) if it should be CMS-swappable in Phase 2.
3. Build the feature component(s) in [`src/features/<domain>/components/`](../src/features/).
4. Add the section to the `DEFAULT_SECTION_ORDER` + `sectionMap` in [`src/app/page.tsx`](../src/app/page.tsx).
5. Add a nav item in [`src/data/navigation.ts`](../src/data/navigation.ts) and a `SECTIONS` entry in [`src/packages/utils/constants.ts`](../src/packages/utils/constants.ts).

## 9. File-Size Budget

- **Soft limit: 250–300 lines** per component file.
- If a file grows beyond that, extract sub-components into the same folder (e.g. `HeroSection.tsx` → `HeroSection.tsx` + `HeroBackground.tsx` + `HeroTerminal.tsx`).
- The 3D scene files (`CoderModel.tsx`, `CloudInfinity.tsx`) are intentionally larger because they define geometry inline; they are the documented exception.
