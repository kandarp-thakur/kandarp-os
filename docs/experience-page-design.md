# Experience Page Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Terminal-native · DevOps-themed
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The Experience page treats a career as a **deployment history** — each role is a "deployment" with a version, status, commit history, and changelog. An **animated timeline** runs vertically through the page, and each role is an **expandable glass card** that reveals details like a CI/CD pipeline expanding its build logs.

**One-line vision:** *Your career isn't a list of jobs. It's a deployment log — versioned, statused, and expandable.*

---

## 1. Page Layout

### 1.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─ Page Header ───────────────────────────────────────────┐   │
│   │  // EXPERIENCE                                          │   │
│   │  Deployment History                                     │   │
│   │  $ kubectl get deployments                              │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Timeline ──────────────────────────────────────────────┐    │
│   │  │                                                        │    │
│   │  ●  [Deployment Card v3.0 — Senior Engineer]            │    │
│   │  │     ▸ Status: ● active                                 │    │
│   │  │     ▸ Image: kandarp:v3.0                              │    │
│   │  │     ▸ Replicas: 1/1                                    │    │
│   │  │     [Expand ▼]                                         │    │
│   │  │                                                        │    │
│   │  ●  [Deployment Card v2.0 — Software Engineer]          │    │
│   │  │     ▸ Status: ● completed                              │    │
│   │  │     ▸ Image: kandarp:v2.0                              │    │
│   │  │     ▸ Replicas: 0/0 (scaled down)                      │    │
│   │  │     [Expand ▼]                                         │    │
│   │  │                                                        │    │
│   │  ●  [Deployment Card v1.0 — Intern]                     │    │
│   │        ▸ Status: ● completed                              │    │
│   │        ▸ Image: kandarp:v1.0                               │    │
│   │        ▸ Replicas: 0/0                                    │    │
│   │        [Expand ▼]                                         │    │
│   │                                                           │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│   [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Rules
- **Single column**, centered, `container-default` (1152px max).
- **Timeline** is the primary structure — a vertical line with deployment cards branching off.
- **Cards alternate sides** on desktop (left/right of center line); stacked on mobile.
- **Vertical rhythm:** `space-8` between deployment cards.

---

## 2. Page Header

### 2.1 Anatomy

```
// EXPERIENCE
Deployment History
$ kubectl get deployments
```

### 2.2 Styling

| Element | Spec |
|---------|------|
| Eyebrow | `// EXPERIENCE`, `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.15em |
| Title | `Deployment History`, `text-h1` (36px), `font-bold`, `text-primary` |
| Subtitle | `$ kubectl get deployments`, `text-base`, `font-mono`, `text-secondary` |
| Alignment | Left-aligned |
| Animation | Fade up on scroll enter |

### 2.3 Summary Stats

Below the header, a row of **deployment summary stats** (glass pills):

| Stat | Value | Label |
|------|-------|-------|
| Deployments | 3 | Total roles |
| Uptime | 6y 3m | Total experience |
| Current | 1 active | Current role |
| Commits | 1.2k+ | Total contributions |

---

## 3. The Timeline

### 3.1 Anatomy

A **vertical line** running down the center (desktop) or left side (mobile), with **deployment nodes** branching off:

```
Desktop (alternating):
                    │
        ┌───────────●───────────┐
        │   Card v3.0            │
        │   (left of line)       │
        └────────────────────────┘
                    │
        ┌───────────●───────────┐
        │            Card v2.0   │
        │           (right)      │
        └────────────────────────┘
                    │
        ┌───────────●───────────┐
        │   Card v1.0            │
        │   (left)               │
        └────────────────────────┘
                    │
                    ▼
```

```
Mobile (stacked, line on left):
│
●── ┌────────────────┐
│   │ Card v3.0      │
│   └────────────────┘
│
●── ┌────────────────┐
│   │ Card v2.0      │
│   └────────────────┘
│
●── ┌────────────────┐
│   │ Card v1.0      │
│   └────────────────┘
│
▼
```

### 3.2 Timeline Line

| Property | Desktop | Mobile |
|----------|---------|--------|
| Position | Center (50%) | Left (24px from edge) |
| Width | 2px | 2px |
| Color | `border-default` (`rgba(0,0,0,0.10)`) | same |
| Progress fill | `accent-gradient` (fills as you scroll) | same |
| Style | Solid, with gradient progress overlay | same |

### 3.3 Timeline Nodes

Each deployment has a **node** on the timeline:

| Property | Value |
|----------|-------|
| Shape | Circle |
| Size | 16px |
| Background | `canvas-elevated` (white) |
| Border | 2px solid `accent-solid` |
| Shadow | `glow-accent-sm` (subtle glow) |
| Active deployment | Pulsing animation (scale 1→1.2→1, 2s loop) |
| Completed deployment | Solid accent fill, no pulse |

### 3.4 Timeline Progress Animation

As the user scrolls, the timeline line **fills with the accent gradient** from top to current scroll position:

| Property | Value |
|----------|-------|
| Fill color | `accent-gradient` |
| Animation | Height grows with scroll progress |
| Easing | Smooth (tied to scroll, damp 0.1) |
| Glow | `glow-accent-sm` on the fill edge |

---

## 4. Deployment Cards

### 4.1 Concept

Each role is represented as a **Kubernetes-style deployment card** — with version, status, image, replicas, and an expandable changelog.

### 4.2 Card Anatomy (Collapsed)

```
┌─ Glass Deployment Card ──────────────────────────────────────┐
│                                                              │
│  ● active    v3.0 — Senior Software Engineer        [▼]      │
│  TechCorp · 2024–Present                                     │
│                                                              │
│  Image: kandarp:v3.0     Replicas: 1/1     Uptime: 1y 3m    │
│                                                              │
│  ▸ Backend architecture, DevOps, team mentoring              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Card Styling (Glass)

| Property | Value |
|----------|-------|
| Background | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `16px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-xl` (16px) |
| Shadow | `shadow-glass` |
| Hover | `shadow-glass-hover` + `translateY(-2px)` + `border-accent` |
| Padding | `space-5` (20px) |
| Width | ~480px desktop (alternating sides), full-width mobile |
| Transition | `250ms ease-standard` |

### 4.4 Card Header

| Element | Spec |
|---------|------|
| Status dot | 10px circle, colored (green=active, blue=completed) |
| Status text | `text-xs`, `font-mono`, colored to match dot |
| Version | `v3.0`, `text-sm`, `font-mono`, `font-semibold`, `accent-solid` |
| Role title | `Senior Software Engineer`, `text-base`, `font-semibold`, `text-primary` |
| Company + dates | `TechCorp · 2024–Present`, `text-sm`, `text-secondary` |
| Expand toggle | `▼` chevron, `text-tertiary`, rotates 180° when expanded |

### 4.5 Card Metadata Row

A row of **deployment metadata** in mono font:

| Field | Format | Example |
|-------|--------|---------|
| Image | `Image: kandarp:v3.0` | Versioned self-image |
| Replicas | `Replicas: 1/1` | 1/1 = active, 0/0 = completed |
| Uptime | `Uptime: 1y 3m` | Duration in role |

### 4.6 Card Summary

A one-line summary of responsibilities:

```
▸ Backend architecture, DevOps, team mentoring
```

| Property | Value |
|----------|-------|
| Marker | `▸` in `accent-solid` |
| Text | `text-sm`, `text-secondary` |
| Max lines | 1 (truncated with `…` if long) |

---

## 5. Expandable Detail (Expanded)

### 5.1 Concept

When a card is expanded, it reveals a **CI/CD pipeline-style detail view** — like expanding build logs in a deployment dashboard.

### 5.2 Expanded Anatomy

```
┌─ Glass Deployment Card (Expanded) ──────────────────────────┐
│                                                              │
│  ● active    v3.0 — Senior Software Engineer        [▲]      │
│  TechCorp · 2024–Present                                     │
│                                                              │
│  Image: kandarp:v3.0     Replicas: 1/1     Uptime: 1y 3m    │
│                                                              │
│  ▸ Backend architecture, DevOps, team mentoring              │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│                                                              │
│  📋 CHANGELOG                                                │
│  ✓ Architected microservices platform serving 2M+ req/day    │
│  ✓ Led migration from monolith to Kubernetes (zero downtime)│
│  ✓ Built CI/CD pipeline reducing deploy time by 70%         │
│  ✓ Mentored 4 junior engineers (2 promoted)                 │
│  ✓ Established observability stack (Prometheus + Grafana)    │
│                                                              │
│  🛠 STACK                                                    │
│  [Go] [TypeScript] [Kubernetes] [AWS] [Terraform]           │
│  [PostgreSQL] [Redis] [Kafka] [Grafana]                      │
│                                                              │
│  🌐 LINKS                                                   │
│  [Company ↗] [Projects ↗]                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Expansion Animation

| Property | Value |
|----------|-------|
| Trigger | Click card or `▼` toggle |
| Animation | Height auto + opacity (content fades in) |
| Duration | `duration-slow` (320ms) |
| Easing | `ease-smooth` |
| Chevron | Rotates 180° (`▼` → `▲`), 200ms |
| Content stagger | Changelog items fade in sequentially (+50ms each) |

### 5.4 Expanded Sections

#### Changelog
- **Header:** `📋 CHANGELOG`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Items:** Each prefixed with `✓` in `success` green
- **Text:** `text-sm`, `text-secondary`
- **Format:** Achievement-focused (what was built/achieved, not duties)

#### Stack
- **Header:** `🛠 STACK`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Items:** Tech badges (using `Badge` component)
- **Style:** Glass pills, `text-xs`, `accent-subtle` background, `accent-solid` text
- **Layout:** Wrap, `space-1.5` gap

#### Links
- **Header:** `🌐 LINKS`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Items:** External links (company website, related projects)
- **Style:** Ghost buttons with `↗` icon, `text-sm`, `accent-solid`

---

## 6. Deployment Data Model

Each deployment (role) has this structure:

| Field | Type | Example | Usage |
|-------|------|---------|-------|
| `version` | string | `v3.0` | Card version label |
| `role` | string | `Senior Software Engineer` | Card title |
| `company` | string | `TechCorp` | Company name |
| `startDate` | string | `2024-06` | Start date |
| `endDate` | string \| null | `null` (active) or `2024-05` | End date |
| `status` | enum | `active` \| `completed` | Status dot color |
| `image` | string | `kandarp:v3.0` | Deployment image |
| `replicas` | string | `1/1` or `0/0` | Replica count |
| `uptime` | string | `1y 3m` | Duration |
| `summary` | string | One-line summary | Collapsed view |
| `changelog` | string[] | Array of achievements | Expanded view |
| `stack` | string[] | Array of tech names | Expanded badges |
| `links` | object[] | `[{label, url}]` | Expanded links |

---

## 7. Sample Deployments

### 7.1 Deployment v3.0 (Current)

| Field | Value |
|-------|-------|
| Version | `v3.0` |
| Role | Senior Software Engineer |
| Company | TechCorp |
| Dates | 2024–Present |
| Status | `● active` (green, pulsing) |
| Image | `kandarp:v3.0` |
| Replicas | `1/1` |
| Uptime | `1y 3m` |
| Summary | Backend architecture, DevOps, team mentoring |
| Changelog | Architected microservices (2M+ req/day), led K8s migration, built CI/CD (70% faster), mentored 4 engineers, observability stack |
| Stack | Go, TypeScript, Kubernetes, AWS, Terraform, PostgreSQL, Redis, Kafka, Grafana |

### 7.2 Deployment v2.0

| Field | Value |
|-------|-------|
| Version | `v2.0` |
| Role | Software Engineer |
| Company | StartupInc |
| Dates | 2022–2024 |
| Status | `● completed` (blue, solid) |
| Image | `kandarp:v2.0` |
| Replicas | `0/0` (scaled down) |
| Uptime | `2y 0m` |
| Summary | Full-stack development, CI/CD, cloud migration |
| Changelog | Built customer-facing dashboard (50k+ users), migrated to AWS, automated testing, reduced page load 40% |
| Stack | TypeScript, React, Node.js, AWS, Docker, MongoDB |

### 7.3 Deployment v1.0

| Field | Value |
|-------|-------|
| Version | `v1.0` |
| Role | Software Engineer Intern |
| Company | BigTech |
| Dates | 2021–2022 |
| Status | `● completed` (blue, solid) |
| Image | `kandarp:v1.0` |
| Replicas | `0/0` |
| Uptime | `1y 0m` |
| Summary | Feature development, testing, documentation |
| Changelog | Shipped 12 features, wrote 200+ tests, documented APIs |
| Stack | Python, Java, Jenkins, JUnit, Confluence |

---

## 8. Animation Choreography

### 8.1 Entrance (Scroll-Triggered)

Each deployment card animates in as it scrolls into view:

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | Timeline node | Scale in (0→1) + glow | 0ms | 300ms |
| 2 | Timeline line fill | Grows to node position | 0ms | 400ms |
| 3 | Card | Fade up + slide from timeline side | 100ms | 500ms |
| 4 | Card content | Fade in | 300ms | 300ms |

### 8.2 Easing
- Cards: `ease-enter` (`cubic-bezier(0, 0, 0.2, 1)`)
- Timeline fill: `ease-smooth` (`cubic-bezier(0.45, 0, 0.15, 1)`)
- Node scale: `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`)

### 8.3 Expand/Collapse

| Phase | Animation | Duration |
|-------|-----------|----------|
| Expand | Height auto + content fade-in (stagger) | 320ms |
| Collapse | Height 0 + content fade-out | 250ms |
| Chevron | Rotate 180° | 200ms |

### 8.4 Active Deployment Pulse

The current (active) deployment's status dot **pulses**:

| Property | Value |
|----------|-------|
| Animation | Scale 1 → 1.3 → 1 + opacity 1 → 0.6 → 1 |
| Duration | 2s |
| Easing | `ease-smooth` |
| Loop | Infinite |
| Reduced motion | Disabled (static dot) |

### 8.5 Reduced Motion
- All cards appear immediately (no scroll-triggered animation).
- Timeline line is fully filled (no progressive fill).
- Expand/collapse is instant (no height animation).
- Active dot is static (no pulse).

---

## 9. Interaction

### 9.1 Expand/Collapse
- **Click anywhere on card** (collapsed) → expands.
- **Click toggle `▼`** → expands/collapses.
- **Only one card expanded at a time** (optional — accordion behavior).
- **Expanded card** clicks on content don't collapse (only toggle/header).

### 9.2 Hover (Desktop)
- Card lifts (`translateY(-2px)`), shadow increases, border → accent.
- Timeline node glows brighter.
- Cursor: `pointer` on collapsed card.

### 9.3 Keyboard
- **Tab** moves between cards.
- **Enter/Space** toggles expand/collapse.
- **Escape** collapses an expanded card.
- Focus ring: 2px accent.

### 9.4 Links
- Stack badges are **non-clickable** (display only).
- External links open in new tab (`target="_blank"`, `rel="noopener"`).

---

## 10. Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Timeline position | Center (alternating cards) | Left (stacked cards) |
| Card width | ~480px | Full-width (minus padding) |
| Card sides | Alternate left/right | All right of line |
| Card padding | `space-5` | `space-4` |
| Metadata row | Horizontal (3 fields) | Stacked or 2-column |
| Stack badges | Wrap, comfortable | Wrap, tighter |
| Expand animation | Height + stagger | Height only (faster) |

### 10.1 Mobile Timeline
On mobile, the timeline moves to the **left edge** (24px from screen edge), and all cards stack to the right:

```
│
●── ┌────────────────────┐
│   │ Card v3.0          │
│   └────────────────────┘
│
●── ┌────────────────────┐
│   │ Card v2.0          │
│   └────────────────────┘
```

---

## 11. Accessibility

| Concern | Solution |
|---------|----------|
| **Semantic structure** | `<section>`, `<h2>` per deployment, `<ul>` for changelog |
| **Expand/collapse** | `aria-expanded`, `aria-controls` on toggle |
| **Status** | `aria-label="Status: active"` on status dot |
| **Timeline** | Decorative; `aria-hidden="true"` on the visual line |
| **Keyboard** | Cards are `<button>` or `<div role="button" tabindex="0">` |
| **Focus** | Visible accent ring on focused card |
| **Color independence** | Status has text label + icon, not just color |
| **Motion** | Full reduced-motion fallback |
| **Screen reader order** | Cards read top-to-bottom (chronological) |

---

## 12. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Page header | `PageHeader`, `Eyebrow`, `Stat` |
| Timeline line | Custom (CSS gradient + scroll progress) |
| Timeline node | Custom + `StatusDot` |
| Deployment card | `Card` (glass variant) + custom wrapper |
| Status dot | `StatusDot`, `LiveIndicator` (for active) |
| Tech badges | `Badge` |
| Expand toggle | `Collapse` / `Accordion` |
| Changelog list | `TerminalOutput` (styled) or custom list |
| External links | `ExternalLink` |
| Entrance animation | `Reveal`, `FadeUp`, `Stagger` |
| Section wrapper | `Section`, `Container` |

---

## 13. Design Rules Summary

1. **Career = deployment history.** Each role is a versioned deployment with status.
2. **Animated timeline.** Vertical line fills with gradient as you scroll; nodes mark each role.
3. **Glass cards.** Translucent, blurred, with glass-edge borders and hover lift.
4. **Expandable.** Click to reveal changelog (achievements), stack (tech badges), and links.
5. **Status semantics.** Active = green pulsing; completed = blue solid; replicas 1/1 vs 0/0.
6. **Achievement-focused changelogs.** What was built/achieved, not duties.
7. **Alternating layout** (desktop), stacked (mobile).
8. **One-at-a-time expansion** (accordion) — keeps focus.
9. **Scroll-triggered entrance.** Cards animate in as they enter view.
10. **Reduced motion = static.** Fully readable, zero animation.

---

_The Experience page doesn't list jobs — it deploys versions. Each role is a release, each achievement a commit, and the timeline is the pipeline that shipped a career._
