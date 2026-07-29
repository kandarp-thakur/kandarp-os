# Project Spec — Kandarp OS (Phase 1)

## 1. Product

Kandarp OS is the personal portfolio of **Kandarp Kumar Thakur** — a DevOps & Cloud Engineer specializing in networking, security, and Python automation. It is presented as an **operating system**: a single-page, terminal-themed engineering experience where each career facet is a themed OS module.

## 2. Scope (Phase 1)

Phase 1 delivers a **frontend-only** application:

- A stable, responsive single-page home experience.
- Secondary routes for blog, projects, skills, experience, infrastructure, about, contact.
- A signature 3D background (CloudInfinity) and hero coder avatar.
- Typed, hardcoded content editable in `src/data/`.
- Clean architecture, strict TypeScript, passing lint + build.

**Out of scope (later phases):** admin panel, APIs, auth, database, Docker, cloud deployment.

## 3. Personas

- **Visitor / Recruiter:** lands on the hero, scrolls the single-page OS, opens blog posts, uses the contact terminal. Wants fast, impressive, accessible.
- **Owner (Kandarp):** edits content in `src/data/*.ts` (Phase 1) → later via admin console (Phase 2).

## 4. Functional Requirements

| ID    | Requirement                                                                  |
| ----- | ---------------------------------------------------------------------------- |
| FR-1  | The home page renders all sections in a configurable order with anchor ids.  |
| FR-2  | Each section is reachable via navbar smooth-scroll + scroll-spy.             |
| FR-3  | The hero shows a boot sequence + terminal typewriter + 3D coder avatar.      |
| FR-4  | Projects render as a "container fleet" (`docker ps` aesthetic).             |
| FR-5  | Experience renders as versioned "deployments" on a timeline.                |
| FR-6  | Infrastructure + Skills render as interactive topology graphs.              |
| FR-7  | Blog posts are authored as MDX and rendered with a TOC + reading time.       |
| FR-8  | The contact section exposes socials as terminal commands.                    |
| FR-9  | The site is fully responsive (mobile, tablet, desktop).                      |
| FR-10 | SEO metadata, sitemap, robots.txt, JSON-LD are generated.                    |
| FR-11 | 3D fidelity scales with device tier + respects reduced-motion.               |

## 5. Non-Functional Requirements

| ID     | Requirement                                                                  |
| ------ | ---------------------------------------------------------------------------- |
| NFR-1  | **Strict TypeScript**, zero type errors.                                     |
| NFR-2  | **ESLint**, zero errors.                                                      |
| NFR-3  | **Build succeeds**; all routes prerendered.                                   |
| NFR-4  | **Performance:** First Load JS shared ≤ ~110 kB; 3D lazy-loaded.             |
| NFR-5  | **Accessibility:** semantic HTML, keyboard nav, focus rings, reduced-motion. |
| NFR-6  | **Security:** strict CSP, HSTS, nosniff, frame-ancestors none.               |
| NFR-7  | **Maintainability:** feature-sliced, < 300 lines per component where viable. |
| NFR-8  | **No backend dependency** at runtime (frontend-only).                        |

## 6. Content Model (Phase 1)

All content is hardcoded + Zod-validated in [`src/data/`](../src/data/). Each domain has a matching Zod schema in [`src/packages/types/`](../src/packages/types/). The public view-models are returned by [`src/lib/public-data.ts`](../src/lib/public-data.ts).

| Domain          | Seed file          | Public accessor                |
| --------------- | ------------------ | ------------------------------ |
| Site identity   | `utils/constants`  | `getPublicSiteIdentity`        |
| Hero            | `data/hero`        | (consumed directly)            |
| About           | `data/about`       | (consumed directly)            |
| Experience      | `data/experience`  | `getPublicExperience`          |
| Projects        | `data/projects`    | `getPublicProjects`            |
| Infrastructure  | `data/infrastructure` | `getPublicInfraNodes`/`Edges` |
| Skills          | `data/skills`      | `getPublicSkills`              |
| Achievements    | `data/achievements`| `getPublicAwards`              |
| Blog            | `content/blog/*.mdx` | `getPublicBlogPosts`         |
| Socials         | `data/socials`     | `getPublicSocials`             |
| Navigation      | `data/navigation`  | (consumed directly)            |

## 7. Constraints

- Next.js 15 App Router, React 19, TypeScript 5 strict.
- Tailwind CSS 3 + CSS custom-property design tokens.
- Three.js / R3F / drei for 3D.
- No runtime backend, no env vars required (optional `NEXT_PUBLIC_SITE_URL`).

## 8. Success Criteria (Phase 1)

- [x] Clean frontend-only application.
- [x] Modular, maintainable codebase.
- [x] Stable, responsive hero.
- [x] Build succeeds without errors.
- [x] No unused backend files remain.
- [x] Documentation fully updated.
- [x] Ready for Phase 2 (Admin) and Phase 3 (Backend).
