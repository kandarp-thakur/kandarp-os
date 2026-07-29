# Folder Structure — Kandarp OS (Phase 1)

The full source tree of the frontend-only build. Paths are relative to the repo root.

```
kandarp-os/
├── README.md
├── CHANGELOG.md
├── next.config.mjs              # Next.js config (security headers, optimisations)
├── package.json                 # scripts + dependencies (frontend-only)
├── tsconfig.json                # strict TS + path aliases (@backend/* → src/lib/*)
├── tailwind.config.ts           # Tailwind theme (design tokens)
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc / .prettierignore
├── .gitignore / .npmrc
│
├── content/
│   └── blog/                    # MDX blog posts (frontmatter + body)
│
├── public/
│   ├── images/profile/          # hero portrait (webp)
│   ├── media/                   # generated media variants
│   ├── icons/                   # favicon, icons
│   ├── fonts/                   # self-hosted fonts
│   └── opengraph-image.svg
│
├── docs/                        # ← this documentation set
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── PROJECT_SPEC.md
│   ├── COMPONENT_GUIDE.md
│   ├── STYLE_GUIDE.md
│   ├── ROADMAP.md
│   ├── CHANGELOG.md
│   └── (design docs: hero-design, blog-page-design, …)
│
└── src/
    ├── app/                     # Next.js App Router
    │   ├── layout.tsx           # root layout (providers, background, chrome)
    │   ├── page.tsx             # home — single-page OS experience
    │   ├── loading.tsx          # route loading UI
    │   ├── error.tsx            # route error boundary
    │   ├── not-found.tsx        # 404
    │   ├── globals.css          # global styles + token imports
    │   ├── icon.svg             # favicon
    │   ├── manifest.ts          # PWA manifest
    │   ├── robots.ts            # robots.txt
    │   ├── sitemap.ts           # dynamic sitemap
    │   └── (public)/            # public route group
    │       ├── about/           # /about
    │       ├── background-preview/
    │       ├── blog/            # /blog, /blog/[slug], /blog/tags, /blog/tags/[tag]
    │       ├── cloud-infinity-preview/
    │       ├── contact/         # /contact
    │       ├── experience/      # /experience
    │       ├── infrastructure/  # /infrastructure
    │       ├── projects/        # /projects
    │       └── skills/          # /skills
    │
    ├── assets/
    │   └── fonts.ts             # next/font loaders (Space Grotesk, Inter, JetBrains Mono)
    │
    ├── data/                    # hardcoded content (single source of truth)
    │   ├── about.ts             # about terminal commands + bio
    │   ├── achievements.ts      # achievement badges + stats
    │   ├── blog.ts              # blog unit registry, tints, stat labels
    │   ├── contactCommands.ts   # contact terminal commands
    │   ├── experience.ts        # experience deployments + stats
    │   ├── hero.ts              # hero boot script, roles, motion tokens
    │   ├── infrastructure.ts    # infra nodes/edges/stats
    │   ├── navigation.ts        # nav items
    │   ├── projects.ts          # project containers + fleet stats
    │   ├── site.ts              # site metadata
    │   ├── skills.ts            # skill nodes/edges/stats
    │   └── socials.ts           # social/contact links
    │
    ├── features/                # feature-sliced UI components
    │   ├── about/               # AboutTerminal, AboutOutputView, AchievementsGrid
    │   ├── background/          # PageBackground, CloudInfinityBackground, DevOpsBackground
    │   ├── blog/                # JournalStream, JournalEntry, MdxContent, TableOfContents…
    │   ├── contact/             # ContactTerminal, ConnectLinks
    │   ├── experience/          # ExperienceTimeline, DeploymentCard
    │   ├── footer/              # Footer, FooterBottom, SocialLinks
    │   ├── hero/                # BootScreen, HeroSection, HeroTerminal, HeroBackground…
    │   ├── infrastructure/      # InfrastructureTopology, NodeInspect
    │   ├── layout/              # AppShell, Container, Section, PageContainer…
    │   ├── navigation/          # Navbar, NavList, MobileMenu, Logo, ScrollProgress…
    │   ├── projects/            # ContainerFleet, ContainerInspect, ContainerRow
    │   ├── shared/              # PageHeader, StatPills, CopyButton, ResponsiveImage…
    │   └── skills/              # SkillsMesh
    │
    ├── infrastructure/          # cross-cutting infrastructure
    │   ├── providers/           # AnimationProvider, ThreeProvider, Providers
    │   ├── styles/              # tokens.css, devops-background.css, admin-tokens.css
    │   └── three/               # Three.js scenes + hooks
    │       ├── cloudInfinity/   # the signature background object
    │       ├── coderModel/      # the hero coder avatar
    │       ├── Avatar/          # avatar loader/materials/scene
    │       ├── scenes/          # Scene3D, SceneFallback
    │       └── hooks/           # useDeviceTier, useMouse, useReducedMotion…
    │
    ├── lib/                     # frontend-only data layer + helpers
    │   ├── public-data.ts       # content accessors (the @backend seam)
    │   ├── site-types.ts        # shared view-model types (NavItem, SocialLink…)
    │   ├── revalidate.ts        # ISR tag registry (inert in FE-only build)
    │   ├── blog.ts              # MDX content loader (fs + gray-matter)
    │   ├── aboutSummary.ts      # about view-model helpers
    │   ├── blogSummary.ts       # blog view-model helpers
    │   ├── contactSummary.ts
    │   ├── experienceSummary.ts
    │   ├── infrastructureSummary.ts
    │   ├── projectsSummary.ts
    │   ├── skillsSummary.ts
    │   ├── terminalCommands.ts
    │   └── terminalLines.ts
    │
    └── packages/                # reusable primitives
        ├── config/              # site config
        ├── hooks/               # useTerminal, useHeroTerminal, useSiteConfig, useAnalyticsBeacon…
        ├── types/               # Zod schemas + inferred types (per domain)
        ├── ui/                  # Button, Card, GlassCard, Badge, Modal, Input…
        └── utils/               # cn, constants, navigation, index
```

## Path Aliases

Defined in [`tsconfig.json`](../tsconfig.json):

| Alias                | Resolves to                |
| -------------------- | -------------------------- |
| `@/*`                | `src/*`                    |
| `@packages/*`        | `src/packages/*`           |
| `@features/*`        | `src/features/*`           |
| `@hooks/*`           | `src/packages/hooks/*`     |
| `@utils/*`           | `src/packages/utils/*`     |
| `@config/*`          | `src/packages/config/*`    |
| `@data/*`            | `src/data/*`               |
| `@lib/*`             | `src/lib/*`                |
| `@assets/*`          | `src/assets/*`             |
| `@styles/*`          | `src/infrastructure/styles/*` |
| `@providers`         | `src/infrastructure/providers/index.tsx` |
| `@3d/*`              | `src/infrastructure/three/*` |
| `@backend/services/public-data` | `src/lib/public-data.ts` (shim) |
| `@backend/schemas/types`        | `src/lib/site-types.ts` (shim) |
| `@backend/cache/revalidate`     | `src/lib/revalidate.ts` (shim) |

> The `@backend/*` aliases are intentional seams. They redirect to the frontend-only shims so the public components keep their original imports. Phase 2 will repoint them to the new CMS implementation.
