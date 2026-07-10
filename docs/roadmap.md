# Roadmap — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

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
| 0 | Foundation | Project scaffold, tooling, CI/CD | 🔄 In Progress |
| 1 | Core Experience | Shippable portfolio with hero, projects, contact | ⏳ Planned |
| 2 | Living Layer | Real-time data, blog, content pipeline | ⏳ Planned |
| 3 | Polish & Performance | Awwwards-grade polish, 60fps 3D, a11y audit | ⏳ Planned |
| 4 | Open Source | Extract as reusable framework | 🔮 Future |

---

## 3. Phase 0 — Foundation

> **Goal:** A reproducible, tooled, documented starting point. Nothing user-facing ships here.

### 3.1 Setup & Tooling
- [ ] Initialize Next.js 14+ App Router project
- [ ] Configure TypeScript (strict mode)
- [ ] Configure Tailwind CSS with design tokens
- [ ] Configure ESLint + Prettier
- [ ] Configure Husky + lint-staged (pre-commit hooks)
- [ ] Configure Commitlint (conventional commits)
- [ ] Set up `next/font` with primary typeface

### 3.2 Architecture & Standards
- [ ] Create folder structure (✅ done)
- [ ] Author all `/docs` (🔄 in progress)
- [ ] Define Zod schemas for all data types in `src/types/`
- [ ] Seed `src/data/` with placeholder content
- [ ] Configure path aliases (`@/`, `@components/`, etc.)

### 3.3 CI/CD
- [ ] GitHub Actions: lint + typecheck + build on PR
- [ ] Vercel preview deployments per PR
- [ ] Lighthouse CI on preview builds
- [ ] Dependabot enabled

### 3.4 Definition of Done (Phase 0)
- `npm run build` passes with zero warnings.
- `npm run lint` passes with zero errors.
- A blank, token-themed page renders at `/`.
- All docs are written and approved.

---

## 4. Phase 1 — Core Experience (MVP)

> **Goal:** A complete, shippable portfolio. A visitor can learn who Kandarp is, see their work, and contact them.

### 4.1 Design System Implementation
- [ ] Implement color tokens (light + dark)
- [ ] Implement typography scale
- [ ] Implement spacing + radius + shadow tokens
- [ ] Build base UI primitives: `Button`, `Input`, `Card`, `Badge`, `Container`
- [ ] Build layout primitives: `Section`, `Grid`, `Stack`
- [ ] Theme provider + dark mode toggle

### 4.2 Layout Shell
- [ ] `Header` with navigation + theme toggle
- [ ] `Footer` with social links + copyright
- [ ] Responsive navigation (mobile menu)
- [ ] Page transition animations (Framer Motion)

### 4.3 Home Page
- [ ] Hero section with name, role, tagline
- [ ] Animated background (2D fallback first)
- [ ] Quick-links to key sections
- [ ] Above-the-fold CTA (view work / contact)

### 4.4 Projects
- [ ] Projects listing page (`/projects`)
- [ ] Project card component
- [ ] Project detail page (`/projects/[slug]`)
- [ ] `generateStaticParams` for static generation
- [ ] Tech stack badges, links (live + repo)

### 4.5 Experience
- [ ] Timeline component
- [ ] Experience data in `src/data/`
- [ ] Role, company, dates, description, achievements

### 4.6 Skills
- [ ] Categorized skill grid
- [ ] Proficiency indicators
- [ ] Skill data in `src/data/`

### 4.7 About
- [ ] Bio section
- [ ] Photo / avatar
- [ ] Personal philosophy / values

### 4.8 Contact
- [ ] Contact form (React Hook Form + Zod)
- [ ] `/api/contact` route (Edge runtime)
- [ ] Email service integration (Resend / similar)
- [ ] Success / error states
- [ ] Spam protection (honeypot + rate limit)

### 4.9 SEO & Metadata
- [ ] Per-route metadata via `generateMetadata`
- [ ] Open Graph + Twitter cards
- [ ] `sitemap.xml` + `robots.txt`
- [ ] JSON-LD structured data (Person, ProfilePage)

### 4.10 Definition of Done (Phase 1)
- All core routes render and are responsive.
- Lighthouse ≥ 90 on all core routes.
- Contact form sends email successfully.
- Deployed to production on Vercel.

---

## 5. Phase 2 — Living Layer

> **Goal:** The site stops being static. It reflects real, current work and hosts writing.

### 5.1 Real-Time Data
- [ ] GitHub integration — latest repos via `src/services/github.ts`
- [ ] Auto-updating "latest work" section
- [ ] Commit activity / contribution graph (optional)

### 5.2 Blog / Writing
- [ ] MDX content pipeline
- [ ] Blog listing (`/blog`) with pagination
- [ ] Blog post page (`/blog/[slug]`)
- [ ] Reading time, table of contents
- [ ] Code syntax highlighting (Shiki / Prism)
- [ ] RSS feed

### 5.3 Content Management
- [ ] File-based content in a `content/` directory
- [ ] Frontmatter validation with Zod
- [ ] Draft / published states
- [ ] ISR revalidation on content change

### 5.4 Analytics & Insights
- [ ] Privacy-respecting analytics (Plausible/Umami)
- [ ] Dashboard view (private, auth-gated)

### 5.5 Definition of Done (Phase 2)
- GitHub data renders live on the site.
- At least 3 blog posts published.
- RSS feed validates.
- Analytics capturing events.

---

## 6. Phase 3 — Polish & Performance

> **Goal:** Awwwards-grade craft. Every interaction is intentional, every animation is smooth, every edge is considered.

### 6.1 3D Experience
- [ ] Hero 3D scene (R3F) with 2D fallback
- [ ] 3D project navigation (orbital / spatial)
- [ ] Custom GLSL shaders for signature visuals
- [ ] `prefers-reduced-motion` handling
- [ ] WebGL feature detection + graceful fallback

### 6.2 Motion Design
- [ ] Scroll-driven animations
- [ ] Micro-interactions on all interactive elements
- [ ] Page transition choreography
- [ ] Loading states + skeletons

### 6.3 Performance Hardening
- [ ] Lighthouse ≥ 95 all categories
- [ ] Bundle analysis + budget enforcement in CI
- [ ] Image audit — all AVIF/WebP
- [ ] Font subsetting + preload
- [ ] 3D asset compression (Draco + KTX2)

### 6.4 Accessibility Audit
- [ ] WCAG 2.1 AA audit (manual + automated)
- [ ] Keyboard navigation pass
- [ ] Screen reader pass (NVDA + VoiceOver)
- [ ] Color contrast verification
- [ ] Focus management for 3D interactions

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
