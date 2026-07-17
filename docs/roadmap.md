# Roadmap — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-16

---

## 1. Roadmap Philosophy

The roadmap is **outcome-driven**, not feature-driven. Each phase delivers a **coherent, shippable experience**. Phases are sequential, but tasks within a phase may overlap.

- ✅ **Done** — Shipped to production.
- 🔄 **In Progress** — Actively being built.
- ⏳ **Planned** — Scoped, not started.
- 🔮 **Future** — Envisioned, not yet scoped.

---

## 2. Phase Overview

```
Phase 0          Phase 1          Phase 2          Phase 3          Phase 4
Foundation  ──▶  Core Experience  ──▶  Living Layer  ──▶  Polish & Perf  ──▶  Open Source
 (Setup)         (MVP)                (Data + Blog)      (Awwwards)         (Framework)
```

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 0 | Foundation | Project scaffold, tooling, docs | ✅ Mostly Done (CI/CD + hooks pending) |
| 1 | Core Experience | Shippable portfolio with hero, projects, contact | ✅ Mostly Done (contact is a terminal, not a form) |
| 2 | Living Layer | Blog + content pipeline; live data | 🔄 In Progress (MDX blog done; GitHub/RSS pending) |
| 2.5 | Admin CMS | Self-hosted content management for the whole site | ✅ Done (undocumented until now) |
| 3 | Polish & Performance | Awwwards-grade polish, 60fps 3D, a11y audit | 🔄 In Progress (3D + motion done; audits/CI pending) |
| 4 | Open Source | Extract as reusable framework | 🔮 Future |

> **Reality note (2026-07-16):** The codebase advanced well past the original phase plan before this roadmap was synced. A full custom **Admin CMS** (~120 API routes, ~40 admin pages, HMAC-JWT auth, JSON store, RBAC) was built — it never appeared in the original phases and is captured here as Phase 2.5. Several original Phase 1/2 items were also intentionally re-scoped: the contact page is a **terminal UI**, not a form + email service; the theme is **dark-only** by design (no toggle); the data layer lives in `src/lib/admin/`, not the planned `src/services/`. Checkboxes below reflect what actually exists in the code.

---

## 3. Phase 0 — Foundation

> **Goal:** A reproducible, tooled, documented starting point. Nothing user-facing ships here.

### 3.1 Setup & Tooling
- [x] Initialize Next.js App Router project (Next 15, React 19)
- [x] Configure TypeScript (strict mode + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- [x] Configure Tailwind CSS with design tokens
- [x] Configure ESLint + Prettier
- [ ] Configure Husky + lint-staged (pre-commit hooks) — **not set up**
- [ ] Configure Commitlint (conventional commits) — **not set up**
- [x] Set up `next/font` with primary typeface (via `@/assets/fonts`)

### 3.2 Architecture & Standards
- [x] Create folder structure
- [x] Author all `/docs`
- [x] Define Zod schemas for all data types in `src/types/`
- [x] Seed `src/data/` with typed content (12 data modules)
- [x] Configure path aliases (13 aliases in `tsconfig.json`)

### 3.3 CI/CD
- [ ] GitHub Actions: lint + typecheck + build on PR — **no `.github/` dir exists**
- [ ] Vercel preview deployments per PR
- [ ] Lighthouse CI on preview builds
- [ ] Dependabot enabled

### 3.4 Definition of Done (Phase 0)
- [x] `npm run typecheck` passes clean.
- [x] `npm run lint` configured.
- [x] The home page renders at `/`.
- [x] All docs are written (this sync pass, 2026-07-16).
- [ ] CI/CD pipeline + git hooks — **remaining Phase 0 gap**.

---

## 4. Phase 1 — Core Experience (MVP)

> **Goal:** A complete, shippable portfolio. A visitor can learn who Kandarp is, see their work, and contact them.

### 4.1 Design System Implementation
- [x] Implement color tokens (`src/styles/tokens.css`)
- [x] Implement typography scale
- [x] Implement spacing + radius + shadow tokens
- [x] Build base UI primitives (`ui/`: Avatar, Badge, GlassCard, Input, Textarea, Modal, Tooltip, Popover, …)
- [x] Build layout primitives (`layout/`: PageContainer, ContentWrapper, FooterSlot, …)
- [ ] ~~Theme provider + dark mode toggle~~ — **re-scoped: dark-only by design.** `data-theme="dark"` is set statically; no runtime toggle.

### 4.2 Layout Shell
- [x] Header / navigation (Navbar, NavDropdown, Hamburger, CommandButton)
- [x] `Footer` with social links + copyright (`footer/`)
- [x] Responsive navigation (mobile menu)
- [x] Page + scroll animations (Framer Motion + Lenis + GSAP via `AnimationProvider`)

### 4.3 Home Page
- [x] Hero section with name, role, tagline (`HeroSection`, `BootScreen`)
- [x] Animated background (`DevOpsBackground`, `PageBackground`, constellation) + 3D cloud-infinity
- [x] Section composition (single-page home: hero → about → experience → projects → infra → skills → achievements → contact → journal)
- [x] Above-the-fold CTA

### 4.4 Projects
- [x] Projects listing page (`/projects`) — rendered as a "container fleet" (`ContainerFleet`, `ContainerInspect`)
- [x] Project card component (`cards/`)
- [ ] Project detail page (`/projects/[slug]`) — **not built**; projects surface via inspect panels, not per-slug routes
- [x] Project data validated via `containerSchema`
- [x] Tech stack badges, links (live + repo)

### 4.5 Experience
- [x] Timeline component (`ExperienceTimeline`)
- [x] Experience data in `src/data/experience.ts`
- [x] Role, company, dates, description, achievements

### 4.6 Skills
- [x] Categorized skill grid / graph (`SkillsMesh`, derived edges)
- [x] Proficiency indicators
- [x] Skill data in `src/data/skills.ts`

### 4.7 About
- [x] Bio section (`AboutTerminal`, `AboutOutputView`)
- [x] Photo / avatar (`ui/Avatar`)
- [x] Personal philosophy / values

### 4.8 Contact — **re-scoped to a terminal UI**
The original form + email plan was replaced by an interactive **terminal** (`ContactTerminal`, `/contact` + home section) driven by commands (`help`, `resume`, `github`, `email`, `linkedin`, …). No public form, `/api/contact` route, or email service was built.
- [x] Contact experience shipped (terminal UI, `src/data/contactCommands.ts`)
- [ ] ~~Contact form (React Hook Form + Zod)~~ — dropped in favor of terminal
- [ ] ~~`/api/contact` route (Edge runtime)~~ — not built
- [ ] ~~Email service integration (Resend / similar)~~ — not built (`.env.example` references `CONTACT_EMAIL_API_KEY` but nothing consumes it)
- [ ] ~~Spam protection (honeypot + rate limit)~~ — N/A without a form

### 4.9 SEO & Metadata
- [x] Per-route metadata via `generateMetadata` (CMS-sourced with SITE fallback)
- [x] Open Graph + Twitter cards (static `/opengraph-image.svg`; no dynamic `ImageResponse`)
- [x] `sitemap.ts` + `robots.ts` (dynamic; merges CMS + MDX posts/tags)
- [x] JSON-LD structured data — `WebSite` + `Person` `@graph` in root layout

### 4.10 Definition of Done (Phase 1)
- [x] All core routes render and are responsive.
- [ ] Lighthouse ≥ 90 on all core routes — **not yet measured**.
- [x] Contact experience shipped (terminal, not email).
- [ ] Deployed to production on Vercel — **unverified in repo**.

---

## 5. Phase 2 — Living Layer

> **Goal:** The site stops being static. It reflects real, current work and hosts writing.

### 5.1 Real-Time Data
- [ ] GitHub integration — latest repos — **not built** (no `src/services/github.ts`; `src/services/` is empty)
- [ ] Auto-updating "latest work" section — **not built**
- [ ] Commit activity / contribution graph (optional) — **not built**

### 5.2 Blog / Writing
- [x] MDX content pipeline (`src/lib/blog.ts` — `fs` + `gray-matter` + `next-mdx-remote` + `remark-gfm` + `rehype-slug`)
- [x] Blog listing (`/blog`) — plus `/blog/tags` and `/blog/tags/[tag]`
- [x] Blog post page (`/blog/[slug]`) with `generateStaticParams`
- [x] Reading time (200 wpm) + table of contents (H2/H3 via `github-slugger`)
- [x] Code syntax highlighting (`CodeBlock.tsx`)
- [ ] RSS feed — **not built** (no `feed.xml` route)

### 5.3 Content Management
> Delivered far beyond the original plan — see **Phase 2.5 (Admin CMS)** below.
- [x] File-based content in `content/blog/` (7 MDX posts)
- [x] Frontmatter validation with Zod (`blogPostSchema` — throws on malformed frontmatter)
- [x] Draft / published states (CMS-managed)
- [x] ISR revalidation on content change (`src/lib/admin/revalidate.ts`)

### 5.4 Analytics & Insights
- [x] Analytics capture (`/api/admin/analytics` POST; `.admin-data/analytics.json`)
- [x] Dashboard view (auth-gated `admin/(console)/analytics`)
- [ ] Privacy-respecting third-party analytics (Plausible/Umami) — **not integrated** (self-hosted instead)

### 5.5 Definition of Done (Phase 2)
- [ ] GitHub data renders live on the site — **not done**.
- [x] At least 3 blog posts published (7 exist).
- [ ] RSS feed validates — **not built**.
- [x] Analytics capturing events (self-hosted).

---

## 5.5 Phase 2.5 — Admin CMS (Delivered, originally unplanned)

> **Goal:** A self-hosted content management system so every section of the public site is editable without code changes. This phase was not in the original plan; it was built organically and is documented here retroactively.

### Auth & Access Control
- [x] HMAC-JWT session cookie (`kos_admin_session`), edge-verified in `src/middleware.ts`
- [x] Route protection for `/admin` and `/api/admin` (`x-is-admin` strips public chrome)
- [x] RBAC (`src/lib/admin/rbac.ts`) — roles, sessions, users
- [x] Login / logout / me / forgot flows (`/api/admin/auth/*`)

### Data & API
- [x] JSON-file data store (`src/lib/admin/store.ts`, `repo.ts`; `.admin-data/`)
- [x] ~120 API route handlers under `src/app/api/admin/`
- [x] Per-entity CRUD pattern: list, `[id]`, `bulk`, `export`, `import`, `reorder`, `archive`, `restore`, `restore-version`
- [x] Zod-validated inputs (`src/lib/admin/types.ts`, `crud.ts`, `relationships.ts`)
- [x] Public-data projection (`src/lib/admin/public-data.ts`) feeding the public site
- [x] ISR revalidation hooks (`src/lib/admin/revalidate.ts`)

### Admin Console (~40 pages under `admin/(console)/`)
- [x] Dashboard, analytics, activity-logs, system-health
- [x] Content entities: projects, blog, experience, education, skills, infrastructure, certificates, awards, services, resumes
- [x] Media: asset-manager, media upload, crop/focal-point/optimize
- [x] Site config: settings, seo, theme, navigation, footer, menus, integrations, api-keys
- [x] Users, roles, sessions, security, notifications, preferences, profile
- [x] Website-builder, forms, search, backup

### Known gaps / notes
- Data store is JSON files on disk, not a database — single-instance by design.
- No automated tests cover the admin subsystem (see cross-cutting gaps).

---

## 6. Phase 3 — Polish & Performance

> **Goal:** Awwwards-grade craft. Every interaction is intentional, every animation is smooth, every edge is considered.

### 6.1 3D Experience
- [x] 3D scenes (R3F) with 2D fallback (`Canvas3D`, `Scene3D`, `SceneFallback`)
- [x] Signature 3D objects (`cloudInfinity/`, `coderModel/`) — orbital/spatial navigation
- [ ] Custom GLSL shaders — **not built** (standard three materials only; code comments note effects achieved "without a custom shader")
- [x] `prefers-reduced-motion` handling (`useReducedMotion.ts`)
- [x] WebGL feature detection + device-tier fallback (`useDeviceTier.ts`, tier-gated postprocessing)

### 6.2 Motion Design
- [x] Scroll-driven animations (Lenis + GSAP ScrollTrigger, shared rAF loop)
- [x] Micro-interactions (Framer Motion across components)
- [ ] Page transition choreography — **partial**
- [x] Loading states + skeletons (`loading.tsx`, `BootScreen`)

### 6.3 Performance Hardening
- [ ] Lighthouse ≥ 95 all categories — **not measured in CI**
- [ ] Bundle analysis + budget enforcement in CI — **no CI**
- [x] Image optimization pipeline (`sharp`, `src/lib/admin/image-optimization.ts`)
- [x] Font optimization (`next/font` via `@/assets/fonts`)
- [ ] 3D asset compression (Draco + KTX2) — **not applied**

### 6.4 Accessibility Audit
- [ ] WCAG 2.1 AA audit (manual + automated) — **not run**
- [ ] Keyboard navigation pass — **partial** (`SkipNav` present)
- [ ] Screen reader pass (NVDA + VoiceOver) — **not run**
- [ ] Color contrast verification — **not run**
- [ ] Focus management for 3D interactions — **not audited**

### 6.5 Definition of Done (Phase 3)
- Lighthouse ≥ 95 on all routes.
- 3D runs at 60fps desktop / 30fps mobile.
- Zero automated a11y violations.
- Submitted to Awwwards / CSS Design Awards.

---

## 7. Phase 4 — Open Source (Future)

> **Goal:** Extract Kandarp OS into a reusable framework others can adopt.

### 7.1 Framework Extraction
- [ ] Abstract personal data into a config schema
- [ ] Theme system (swappable design tokens)
- [ ] Plugin architecture for 3D scenes
- [ ] CLI scaffolding tool

### 7.2 Community
- [ ] Public GitHub repo + license (MIT)
- [ ] Contribution guide
- [ ] Example themes
- [ ] Documentation site

### 7.3 Definition of Done (Phase 4)
- A second developer can clone, configure, and deploy their own portfolio in < 1 hour.
- Framework has its own documentation site.

---

## 8. Cross-Cutting Concerns (Ongoing)

These are not phase-bound; they are maintained continuously.

| Concern | Cadence | Owner |
|---------|---------|-------|
| Dependency updates | Weekly | Dependabot + manual review |
| Security audit | Monthly | `npm audit` + review |
| Documentation sync | Every PR | PR author |
| Performance regression check | Every PR | Lighthouse CI |
| Accessibility check | Every PR | axe-core in CI |

---

## 9. Milestone Timeline (Indicative)

> Dates are indicative, not contractual. Quality gates override dates.

| Milestone | Target |
|-----------|--------|
| Phase 0 complete | Q3 2026 |
| Phase 1 (MVP) shipped | Q4 2026 |
| Phase 2 (Living Layer) | Q1 2027 |
| Phase 3 (Polish) | Q2 2027 |
| Phase 4 (Open Source) | Q3 2027+ |

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| 3D performance on low-end devices | High | High | Progressive enhancement + fallbacks |
| Scope creep in Phase 1 | Medium | Medium | Strict Definition of Done per phase |
| Dependency on external APIs (GitHub) | Medium | Low | Cache aggressively; degrade gracefully |
| Burnout (solo project) | Medium | High | Time-box phases; ship incrementally |

---

_The roadmap is reviewed at the end of each phase. Adjustments are documented here with a dated changelog entry._
