# Kandarp OS — Documentation

> The single source of truth for the Kandarp OS portfolio platform.
> This directory contains all project documentation: vision, architecture, design, roadmap, and engineering standards.

---

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [`README.md`](./README.md) | Documentation hub & navigation | Everyone |
| [`vision.md`](./vision.md) | Product vision, mission, and north-star goals | All stakeholders |
| [`architecture.md`](./architecture.md) | System architecture, data flow, and technical decisions | Engineers, Architects |
| [`roadmap.md`](./roadmap.md) | Phased delivery plan and milestones | PMs, Engineers |
| [`design-system.md`](./design-system.md) | Visual language, tokens, and theming | Designers, Frontend |
| [`ui-system.md`](./ui-system.md) | Full UI spec: glassmorphism, colors, type, components, motion | Designers, Frontend |
| [`component-inventory.md`](./component-inventory.md) | Complete list of all 244 reusable components by category | All Engineers |
| [`threejs-architecture.md`](./threejs-architecture.md) | 3D system architecture: camera, lighting, particles, effects | 3D Engineers |
| [`devops-background.md`](./devops-background.md) | Animated DevOps icon constellation background design | 3D Engineers, Designers |
| [`hero-design.md`](./hero-design.md) | Hero section design: name, terminal, portrait, buttons | Designers, Frontend |
| [`navigation-design.md`](./navigation-design.md) | Glass navbar, sticky behavior, mobile menu, links | Designers, Frontend |
| [`about-page-design.md`](./about-page-design.md) | About page as terminal session: whoami, neofetch, hostnamectl | Designers, Frontend |
| [`projects-page-design.md`](./projects-page-design.md) | Projects page as container fleet: docker ps table, docker inspect panel | Designers, Frontend |
| [`experience-page-design.md`](./experience-page-design.md) | Experience page as deployment history: kubectl timeline, expandable deployment cards | Designers, Frontend |
| [`skills-page-design.md`](./skills-page-design.md) | Skills page as service mesh: topology graph of connected nodes, hover-traced subgraphs | Designers, Frontend |
| [`blog-page-design.md`](./blog-page-design.md) | Blog page as systemd journal: journalctl stream, units (categories), grep search, Markdown posts | Designers, Frontend |
| [`component-rules.md`](./component-rules.md) | Component contracts, composition, and conventions | Frontend Engineers |
| [`folder-structure.md`](./folder-structure.md) | Directory layout and file placement rules | All Engineers |
| [`coding-standards.md`](./coding-standards.md) | Code style, linting, formatting, and review rules | All Engineers |
| [`optimization-plan.md`](./optimization-plan.md) | Performance contract: lazy loading, dynamic imports, instancing, LOD, tree shaking, image + Three.js optimization for 95 Lighthouse & 60 FPS | All Engineers |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm run start

# Lint the codebase
npm run lint
```

The development server runs at `http://localhost:3000`.

---

## 🧭 Reading Order

If you are new to the project, read the documents in this order:

1. **[`vision.md`](./vision.md)** — Understand *why* this project exists.
2. **[`architecture.md`](./architecture.md)** — Understand *how* the system is built.
3. **[`folder-structure.md`](./folder-structure.md)** — Understand *where* things live.
4. **[`design-system.md`](./design-system.md)** — Understand *what* it looks like.
5. **[`ui-system.md`](./ui-system.md)** — Understand the *full UI specification*.
6. **[`component-rules.md`](./component-rules.md)** — Understand *how* components are built.
7. **[`coding-standards.md`](./coding-standards.md)** — Understand *how* code is written.
8. **[`optimization-plan.md`](./optimization-plan.md)** — Understand *how* the site stays fast (95 Lighthouse, 60 FPS).
9. **[`roadmap.md`](./roadmap.md)** — Understand *when* things ship.

### Page Design Documents

Each page is built around a DevOps metaphor. Read these after the foundational docs to understand the layout, interaction, and component mapping for each surface:

- [`hero-design.md`](./hero-design.md) — Hero section (terminal + portrait)
- [`navigation-design.md`](./navigation-design.md) — Glass navbar & mobile menu
- [`about-page-design.md`](./about-page-design.md) — About as terminal session (`whoami`, `neofetch`)
- [`projects-page-design.md`](./projects-page-design.md) — Projects as container fleet (`docker ps`)
- [`experience-page-design.md`](./experience-page-design.md) — Experience as deployment history (`kubectl`)
- [`skills-page-design.md`](./skills-page-design.md) — Skills as service mesh (`istioctl`)
- [`blog-page-design.md`](./blog-page-design.md) — Blog as systemd journal (`journalctl`)

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Modules |
| 3D / Graphics | React Three Fiber, Three.js |
| Animation | Framer Motion |
| State | React Context + Hooks |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Package Manager | npm |

---

## 📐 Project Principles

1. **Documentation is code.** Keep these docs in sync with the codebase.
2. **Type safety first.** No `any` types. No unchecked runtime data.
3. **Composition over inheritance.** Build small, reusable, composable units.
4. **Performance is a feature.** Measure before optimizing. Ship fast by default.
5. **Accessibility is non-negotiable.** WCAG 2.1 AA compliance minimum.
6. **Design tokens, not magic numbers.** All values flow from the design system.

---

## 📝 Document Conventions

- All documents use **GitHub-flavored Markdown**.
- File and folder references are written as `code spans` (e.g., `src/components/`).
- Code blocks include the language identifier for syntax highlighting.
- Diagrams use **Mermaid** syntax for renderable, version-controlled visuals.
- Status badges: `✅ Active`, `🔄 In Progress`, `⏳ Planned`, `❌ Deprecated`.

---

## 🔄 Document Lifecycle

```
Draft → Review → Approved → Published → Maintained
```

- **Draft** — Author is writing. Not ready for review.
- **Review** — Open for feedback from maintainers.
- **Approved** — Signed off by the lead architect.
- **Published** — Linked from this README and considered canonical.
- **Maintained** — Updated as the codebase evolves.

Every document must declare its status at the top.

---

## 🤝 Contributing to Docs

1. Create a branch: `docs/<topic>-update`.
2. Edit the relevant `.md` file.
3. Update the "Last Updated" date at the bottom of the document.
4. Submit a PR referencing the change.
5. A maintainer must approve before merge.

> **Rule:** A PR that changes code behavior MUST update the relevant documentation in the same PR.

---

## 📂 Subdirectories

| Folder | Contents |
|--------|----------|
| [`vision/`](./vision/) | Vision-related artifacts and references |
| [`architecture/`](./architecture/) | Architecture diagrams and ADRs |
| [`design/`](./design/) | Design tokens, mockups, and references |
| [`api/`](./api/) | API contracts and endpoint documentation |
| [`resume/`](./resume/) | Resume content and structured data |
| [`goals/`](./goals/) | Goal tracking and OKRs |

---

_Last Updated: 2026-07-06_
_Status: ✅ Active_
