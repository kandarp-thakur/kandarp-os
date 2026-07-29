# Kandarp OS

> A portfolio platform built as an operating system — an immersive single-page engineering experience themed as a DevOps terminal/OS.

**Phase 1 — Frontend Foundation.** This repository is currently a clean, standalone **frontend-only** Next.js application. All backend, admin, API, database, Docker, and authentication code has been removed. The site renders entirely from hardcoded content in [`src/data/`](src/data/) via the frontend-only data layer in [`src/lib/public-data.ts`](src/lib/public-data.ts).

---

## Quick Start

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:3000
npm run build    # production build (all routes prerendered)
npm run start    # serve the production build
```

### Verification

```bash
npm run typecheck   # tsc --noEmit  (strict, zero errors)
npm run lint        # next lint     (zero errors)
npm run verify      # typecheck + lint
```

---

## Tech Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Framework        | [Next.js 15](https://nextjs.org) (App Router)          |
| Language         | [TypeScript 5](https://www.typescriptlang.org) (strict)|
| UI               | [React 19](https://react.dev)                          |
| Styling          | [Tailwind CSS 3](https://tailwindcss.com) + CSS tokens |
| 3D / WebGL       | [Three.js](https://threejs.org) + [@react-three/fiber](https://r3f.docs.pmnd.rs) + [drei](https://github.com/pmndrs/drei) |
| Animation        | [Framer Motion](https://www.framer.com/motion) + [GSAP](https://gsap.com) |
| Icons            | [lucide-react](https://lucide.dev)                     |
| Content          | Static MDX (`content/blog/`) + typed seed data         |
| Validation       | [Zod](https://zod.dev)                                 |

---

## Project Structure

```
kandarp-os/
├── src/
│   ├── app/                  # Next.js App Router (routes, layout, metadata)
│   │   ├── (public)/         # public route group (blog, projects, skills…)
│   │   ├── layout.tsx        # root layout (providers, background, chrome)
│   │   ├── page.tsx          # home — the single-page OS experience
│   │   ├── globals.css       # global styles + token imports
│   │   ├── sitemap.ts        # dynamic sitemap
│   │   └── robots.ts         # robots.txt
│   ├── data/                 # hardcoded content (single source of truth)
│   ├── features/             # feature-sliced UI components
│   │   ├── hero/  about/  experience/  projects/
│   │   ├── infrastructure/  skills/  blog/
│   │   ├── navigation/  footer/  layout/  shared/  background/  contact/
│   ├── infrastructure/       # cross-cutting infra (three/, providers/, styles/)
│   ├── lib/                  # frontend-only data layer + helpers
│   │   ├── public-data.ts    # content access (replaces the old backend)
│   │   ├── site-types.ts     # shared view-model types
│   │   ├── revalidate.ts     # ISR tag registry (inert in FE-only build)
│   │   └── blog.ts           # MDX content loader
│   ├── packages/             # reusable primitives (ui/, hooks/, types/, utils/, config/)
│   └── assets/               # fonts
├── content/blog/             # MDX blog posts
├── public/                   # static assets (images, icons, fonts)
└── docs/                     # design + architecture documentation
```

See [`docs/folder-structure.md`](docs/folder-structure.md) for the full tree.

---

## Architecture

The public site is a **single-page engineering experience**: one continuous scroll through the hero, about, experience, projects, infrastructure, skills, achievements, blog, and contact sections. Each section is a reusable component with a stable anchor id.

**Data flow (frontend-only):**

```
src/data/*.ts  ──►  src/lib/public-data.ts  ──►  app/page.tsx + (public)/*  ──►  features/*
(hardcoded)         (typed accessors)             (server components)           (presentational)
```

- All content lives in [`src/data/`](src/data/) as typed, Zod-validated constants.
- [`src/lib/public-data.ts`](src/lib/public-data.ts) exposes async accessors (`getPublicProjects`, `getPublicSiteIdentity`, `getPublicMetadata`, …) that server components consume. The signatures are intentionally identical to the previous full-stack implementation so Phase 2 can swap in a CMS-backed implementation behind the same interface.
- The `@backend/*` path aliases in [`tsconfig.json`](tsconfig.json) redirect to the frontend-only shims in [`src/lib/`](src/lib/) — a deliberate seam that keeps the public components untouched while the backend is absent.

See [`docs/architecture.md`](docs/architecture.md) for the full design.

---

## Editing Content

All content is hardcoded and typed. Edit the relevant file in [`src/data/`](src/data/):

| Content        | File                              |
| -------------- | --------------------------------- |
| Site identity  | [`src/packages/utils/constants.ts`](src/packages/utils/constants.ts) |
| Hero           | [`src/data/hero.ts`](src/data/hero.ts) |
| About          | [`src/data/about.ts`](src/data/about.ts) |
| Experience     | [`src/data/experience.ts`](src/data/experience.ts) |
| Projects       | [`src/data/projects.ts`](src/data/projects.ts) |
| Infrastructure | [`src/data/infrastructure.ts`](src/data/infrastructure.ts) |
| Skills         | [`src/data/skills.ts`](src/data/skills.ts) |
| Achievements   | [`src/data/achievements.ts`](src/data/achievements.ts) |
| Blog posts     | [`content/blog/*.mdx`](content/blog/) |
| Socials        | [`src/data/socials.ts`](src/data/socials.ts) |
| Navigation     | [`src/data/navigation.ts`](src/data/navigation.ts) |

---

## Roadmap

- **Phase 1 ✅ — Frontend Foundation** (this phase): clean, stable, frontend-only.
- **Phase 2 — Admin Panel**: reintroduce a CMS-backed implementation behind the existing `src/lib/public-data.ts` interface.
- **Phase 3 — Backend & Infrastructure**: APIs, auth, database, Docker, deployment.

See [`docs/roadmap.md`](docs/roadmap.md) and [`CHANGELOG.md`](CHANGELOG.md).

---

## License

Private project — © Kandarp Kumar Thakur.
