# Skills Page Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Terminal-native · DevOps-themed
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The Skills page treats a skill set as a **service mesh topology** — each skill is a *node* (a service in the mesh), and the relationships between skills are *edges* (the connections that route work between them). The visitor reads the graph the way an operator reads a service mesh dashboard: by node, by status, and by the links that bind one capability to another.

There are **no progress bars**. Proficiency is not a percentage — it is a **status**, the same vocabulary the rest of the OS uses: `active` (daily driver), `idle` (deployed but not in heavy rotation), `learning` (provisioning, not yet shipped). Hovering a node **illuminates its connected subgraph** — the edges brighten, neighbors highlight, the rest of the mesh dims. The graph is minimal, calm, and explorable.

This is the "OS" identity made relational: the portfolio *is* an operating system, and the Skills page is its service mesh — a living map of what's wired to what.

**One-line vision:** *Your skills aren't a checklist. They're a mesh — every node a service, every edge a connection, every hover a trace.*

---

## 1. Page Layout

### 1.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─ Page Header ───────────────────────────────────────────┐   │
│   │  // SKILLS                                               │   │
│   │  Service Mesh                                            │   │
│   │  $ istioctl proxy-status                                  │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Mesh Stats (glass pills) ──────────────────────────────┐   │
│   │  Nodes  24   Active  9   Idle  11   Learning  4          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Topology Graph (glass) ────────────────────────────────┐    │
│   │                                                          │    │
│   │        ○─────●─────○                                     │    │
│   │        │      │      │                                    │    │
│   │        ●─────●─────○      (nodes = skills)               │    │
│   │        │      │                                            │    │
│   │        ●─────○─────●      (edges = connections)           │    │
│   │                                                          │    │
│   │   hover a node → its subgraph illuminates                 │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│   ┌─ Node Detail (reveals on hover/focus) ─────────────────┐    │
│   │  ● TypeScript        status: active                      │    │
│   │  Daily driver across the mesh                            │    │
│   │  connected: React · Next.js · Node · Tailwind           │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│   [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Rules
- **Single column**, centered, `container-default` (1152px max).
- **Topology graph** is the primary content block — large, glass, prominent, full-bleed within the container.
- **Page header** is minimal — eyebrow + title + command subtitle.
- **Node detail** is a contextual panel that appears below the graph on hover/focus (not a modal — it stays in flow).
- **Vertical rhythm:** `space-8` between header and stats, `space-6` between stats and graph, `space-6` between graph and detail.

---

## 2. Page Header

### 2.1 Anatomy

```
// SKILLS
Service Mesh
$ istioctl proxy-status
```

### 2.2 Styling

| Element | Spec |
|---------|------|
| Eyebrow | `// SKILLS`, `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.15em |
| Title | `Service Mesh`, `text-h1` (36px), `font-bold`, `text-primary` |
| Subtitle | `$ istioctl proxy-status`, `text-base`, `font-mono`, `text-secondary` |
| Alignment | Left-aligned |
| Animation | Fade up on scroll enter |

### 2.3 Mesh Stats

Below the header, a row of **mesh summary stats** (glass pills), mirroring the summary a service mesh control plane reports:

| Stat | Value | Label |
|------|-------|-------|
| Nodes | 24 | Total skills |
| Active | 9 | Daily drivers |
| Idle | 11 | Deployed, not in heavy rotation |
| Learning | 4 | Provisioning |

| Property | Value |
|----------|-------|
| Layout | Horizontal row, `space-3` gap, wraps on mobile |
| Pill style | `glass-bg`, `radius-full`, `space-2 space-4` padding |
| Number | `font-mono`, `text-base`, `font-semibold`, `text-primary` |
| Label | `text-xs`, `text-tertiary`, `font-mono` |
| Active count | Colored `success` |
| Idle count | Colored `text-tertiary` |
| Learning count | Colored `warning` |

---

## 3. The Topology Graph

### 3.1 Concept

The signature element. Skills are **nodes** arranged as a force-directed-style mesh; relationships between skills are **edges**. The graph reads like a service mesh topology view — calm, connected, explorable. Hovering a node traces its connections the way a mesh dashboard highlights a service's dependencies.

### 3.2 Graph Canvas

| Property | Value |
|----------|-------|
| Background | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `16px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-2xl` (20px) |
| Shadow | `shadow-glass` |
| Height | `560px` desktop, `420px` mobile |
| Padding | `space-6` |
| Overflow | Hidden (nodes never escape the canvas) |

### 3.3 Node Layout

Nodes are positioned by a **deterministic force-directed layout** (computed once, stable across renders — no jitter on every paint). The layout is **clustered by domain**: frontend, backend, DevOps, data, design. Clusters drift apart; intra-cluster edges pull neighbors together.

| Property | Value |
|----------|-------|
| Layout algorithm | Force-directed (deterministic seed) |
| Clustering | By `domain` field (color-coded subtly) |
| Node spacing | Min `space-12` (48px) center-to-center |
| Edge length | `space-16` (64px) average, varies with cluster |
| Stability | Positions cached; no re-layout on hover |
| Mobile | Same layout, scaled to fit; pinch/pan optional |

### 3.4 Edges (Connections)

Edges represent **relationships** — skills that are used together, build on each other, or share a domain. An edge is not a dependency arrow; it is a bidirectional link, like two services in a mesh that call each other.

| Property | Value |
|----------|-------|
| Shape | Straight or gently curved line (1px) |
| Color (default) | `border-subtle` (`rgba(0,0,0,0.06)`) |
| Color (illuminated) | `accent-gradient` stroke |
| Width (default) | 1px |
| Width (illuminated) | 1.5px |
| Opacity (default) | 0.5 |
| Opacity (dimmed) | 0.15 (when another node is hovered) |
| Opacity (illuminated) | 1 |
| Animation | Color + opacity transition, `duration-normal` (200ms), `ease-standard` |
| Arrowheads | None — connections are bidirectional |

---

## 4. Nodes

### 4.1 Concept

Each skill is a **node** — a service in the mesh. A node carries a label, a status, and a position. It does not carry a percentage, a bar, or a score. Proficiency is communicated by **status**, consistent with the rest of the OS.

### 4.2 Node Anatomy

```
       ●            ← status ring (color by status)
    ┌─────┐
    │  TS  │        ← label (mono, abbreviated on small nodes)
    └─────┘
```

### 4.3 Node Styling

| Property | Value |
|----------|-------|
| Shape | Circle |
| Size (default) | 40px |
| Size (active) | 48px (slightly larger — daily drivers read bigger) |
| Size (idle) | 40px |
| Size (learning) | 32px (smaller — provisioning) |
| Background | `canvas-elevated` (white) |
| Border | 2px solid (color by status — see §4.5) |
| Shadow | `shadow-glass` |
| Label | Inside node if room; else below, `text-xs`, `font-mono`, `text-secondary` |
| Hover | Scale `1.08`, border → `accent-gradient`, `glow-accent-sm` |
| Transition | `duration-fast` (120ms), `ease-standard` |

### 4.4 Node Label

| Property | Value |
|----------|-------|
| Text | Skill name (e.g., `TypeScript`, `Kubernetes`) |
| Font | `font-mono`, `text-xs` (inside) / `text-2xs` (below) |
| Color (default) | `text-secondary` |
| Color (hovered/illuminated) | `text-primary` |
| Color (dimmed) | `text-quaternary` |
| Abbreviation | On nodes < 40px, use short code (e.g., `TS`, `K8s`, `PG`) |

### 4.5 Status Semantics

Status replaces progress bars. It is the same vocabulary the Projects and Experience pages use, so the OS reads consistently.

| Status | Ring Color | Meaning | Visual |
|--------|-----------|---------|--------|
| `active` | `success` green | Daily driver — used in current work | Larger node, solid ring, subtle pulse |
| `idle` | `text-tertiary` gray | Deployed, not in heavy rotation | Standard node, solid ring, no pulse |
| `learning` | `warning` amber | Provisioning — actively studying | Smaller node, dashed ring |

### 4.6 Active Node Pulse

Active (daily-driver) nodes have a **subtle pulse** on their status ring — the same pulse used for running containers and active deployments elsewhere in the OS:

| Property | Value |
|----------|-------|
| Animation | Ring opacity 1 → 0.5 → 1 + scale 1 → 1.06 → 1 |
| Duration | 2.4s |
| Easing | `ease-smooth` |
| Loop | Infinite |
| Reduced motion | Disabled (static ring) |

### 4.7 Learning Node Dashed Ring

Learning nodes use a **dashed border** to signal "in progress" without a bar:

| Property | Value |
|----------|-------|
| Border style | `2px dashed` `warning` |
| Dash | `4px 3px` |
| Animation | Slow rotate (8s linear) — optional, disabled on reduced motion |

---

## 5. Hover Interaction (The Signature Motion)

### 5.1 Concept

Hovering a node **traces its connections** — the way a service mesh dashboard highlights a service's dependencies. The hovered node and its direct neighbors brighten; the rest of the mesh dims. This is the page's defining interaction: it turns a static graph into an explorable map.

### 5.2 Hover State Machine

| Element | Default | Hovered Node | Neighbor (connected) | Unrelated Node |
|---------|---------|--------------|----------------------|----------------|
| Node border | status color | `accent-gradient` | status color, brighter | status color, dimmed |
| Node scale | 1 | 1.08 | 1.04 | 1 |
| Node opacity | 1 | 1 | 1 | 0.35 |
| Node shadow | `shadow-glass` | `glow-accent-sm` | `shadow-glass` | none |
| Label color | `text-secondary` | `text-primary` | `text-primary` | `text-quaternary` |
| Edge opacity | 0.5 | — | 1 (illuminated) | 0.15 (dimmed) |
| Edge color | `border-subtle` | — | `accent-gradient` | `border-subtle` |
| Edge width | 1px | — | 1.5px | 1px |

### 5.3 Illumination Animation

| Property | Value |
|----------|-------|
| Trigger | `mouseenter` / `focus` on a node |
| Transition in | `duration-normal` (200ms), `ease-standard` |
| Transition out | `duration-fast` (120ms), `ease-exit` (faster out than in) |
| Edge draw | Illuminated edges brighten simultaneously (no stagger — instant trace) |
| Neighbor highlight | Neighbors scale + brighten with a `+40ms` stagger for a subtle ripple |

### 5.4 Node Detail Panel

On hover/focus, a **detail panel** appears below the graph (in flow, not a modal). It shows the hovered node's full identity — like a service's proxy status card:

```
┌─ Node Detail ───────────────────────────────────────────────┐
│                                                              │
│  ● active    TypeScript                                      │
│  Daily driver across the mesh                                │
│                                                              │
│  domain:     frontend                                        │
│  status:     active                                          │
│  connected:  React · Next.js · Node.js · Tailwind · Zod      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `glass-bg`, `radius-xl` (16px), `space-5` padding, `border-default` + glass edge |
| Status dot + name | Dot 10px (status-colored) + name `font-mono`, `text-base`, `font-semibold`, `text-primary` |
| Tagline | `text-sm`, `text-secondary` |
| Fields | `key: value` rows, `font-mono`, `text-xs`, keys `text-tertiary`, values `text-primary` |
| Connected list | Neighbor names as inline mono text, `accent-solid`, `·` separator |
| Animation | Fade up + slide (8px), `duration-normal`, `ease-enter` |
| Empty state (no hover) | A faint hint: `hover a node to inspect`, `text-quaternary`, `font-mono`, `text-xs` |

### 5.5 Hover Rules
- **Only one node hovered at a time.** Moving to a new node re-traces instantly.
- **Hover is enhancement, not requirement.** All node data is available via the detail panel on focus (keyboard) and in the semantic fallback (§11).
- **No tooltips on nodes.** The detail panel is the tooltip — it has room to breathe.
- **Edges are not independently hoverable.** They illuminate only via their endpoints.

---

## 6. Interaction

### 6.1 Hover (Desktop)
- Hover a node → illuminates its subgraph + reveals detail panel.
- Hover an empty area of the canvas → mesh returns to default state, detail panel shows the empty hint.
- Cursor: `pointer` on nodes, `default` on canvas.

### 6.2 Keyboard
- **Tab** moves between nodes (logical order: by domain cluster, then status).
- **Focus** on a node triggers the same illumination as hover (focus = hover for a11y).
- **Enter/Space** on a node is optional — pins the detail panel (keeps it visible after focus leaves). Press again to unpin.
- Focus ring: 2px `accent-solid`, 2px offset, drawn outside the node.
- **Escape** unpins a pinned panel / clears focus.

### 6.3 Touch (Mobile)
- **Tap a node** → illuminates its subgraph + reveals detail panel (tap = hover).
- **Tap empty canvas** → resets.
- No hover-dependent states — tap is the primary interaction.
- Pinch-to-zoom optional; pan optional. Default fit-to-canvas.

### 6.4 Reduced Motion
- No pulse on active nodes (static ring).
- No dashed-ring rotation on learning nodes.
- Illumination is instant (no transition) — the subgraph still highlights, just without animation.
- Detail panel appears instantly (no fade/slide).
- Graph is fully readable as a static map.

---

## 7. Node Data Model

Each skill (node) has this structure:

| Field | Type | Example | Usage |
|-------|------|---------|-------|
| `id` | string | `typescript` | Node identifier (slug) |
| `name` | string | `TypeScript` | Display name |
| `abbr` | string | `TS` | Short code for small nodes |
| `domain` | enum | `frontend` \| `backend` \| `devops` \| `data` \| `design` | Cluster + subtle color |
| `status` | enum | `active` \| `idle` \| `learning` | Ring color + size + pulse |
| `tagline` | string | `Daily driver across the mesh` | Detail panel tagline |
| `connections` | string[] | `["react","nextjs","node","tailwind"]` | Edges (referenced by id) |

Edges are **derived** from each node's `connections` array — they are not stored separately. An edge exists between A and B if B is in A's `connections` (or vice versa; the relationship is symmetric).

---

## 8. Sample Nodes

### 8.1 Node: `typescript` (Active)

| Field | Value |
|-------|-------|
| ID | `typescript` |
| Name | TypeScript |
| Abbr | `TS` |
| Domain | `frontend` |
| Status | `active` (green, pulsing) |
| Tagline | Daily driver across the mesh |
| Connections | React, Next.js, Node.js, Tailwind, Zod |

### 8.2 Node: `kubernetes` (Active)

| Field | Value |
|-------|-------|
| ID | `kubernetes` |
| Name | Kubernetes |
| Abbr | `K8s` |
| Domain | `devops` |
| Status | `active` (green, pulsing) |
| Tagline | Orchestrating production workloads |
| Connections | Go, Terraform, Helm, ArgoCD, Prometheus |

### 8.3 Node: `rust` (Learning)

| Field | Value |
|-------|-------|
| ID | `rust` |
| Name | Rust |
| Abbr | `Rs` |
| Domain | `backend` |
| Status | `learning` (amber, dashed) |
| Tagline | Provisioning — exploring systems programming |
| Connections | WASM, devbox-cli |

### 8.4 Node: `python` (Idle)

| Field | Value |
|-------|-------|
| ID | `python` |
| Name | Python |
| Abbr | `Py` |
| Domain | `backend` |
| Status | `idle` (gray, solid) |
| Tagline | Deployed, not in heavy rotation |
| Connections | ML, Pandas, FastAPI |

### 8.5 Node: `figma` (Idle)

| Field | Value |
|-------|-------|
| ID | `figma` |
| Name | Figma |
| Abbr | `Fg` |
| Domain | `design` |
| Status | `idle` (gray, solid) |
| Tagline | Design system collaboration |
| Connections | Tailwind, design-tokens |

---

## 9. Domains (Clusters)

Nodes cluster by domain. Each domain gets a **subtle tint** — not a loud color, just enough to read the clusters at a glance. Domain color appears only on the node's status ring when idle (active/learning override with their status color).

| Domain | Tint | Sample Nodes |
|--------|------|--------------|
| `frontend` | `info` (`#3B82F6`) | TypeScript, React, Next.js, Tailwind, Framer Motion |
| `backend` | `success` (`#10B981`) | Go, Node.js, Python, Rust, PostgreSQL |
| `devops` | `accent-solid` (`#6366F1`) | Kubernetes, Terraform, Docker, ArgoCD, Helm |
| `data` | `warning` (`#F59E0B`) | PostgreSQL, Redis, Kafka, Prometheus, Grafana |
| `design` | `#EC4899` (pink, from gradient) | Figma, design-tokens, Lucide |

### 9.1 Domain Legend

A small legend sits in the corner of the graph canvas:

| Property | Value |
|----------|-------|
| Position | Top-right of graph canvas, inside |
| Style | `glass-bg-subtle`, `radius-md`, `space-2` padding |
| Items | Domain dot (8px) + label, `text-2xs`, `font-mono`, `text-tertiary` |
| Layout | Vertical stack, `space-1.5` gap |
| `aria-hidden` | `true` (decorative; domains also in semantic fallback) |

---

## 10. Animation Choreography

### 10.1 Entrance (Scroll-Triggered)

The graph assembles as it scrolls into view:

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | Canvas | Fade in | 0ms | 300ms |
| 2 | Edges | Draw in (opacity 0→0.5) | 100ms | 400ms |
| 3 | Nodes | Scale in (0.8→1) + fade, staggered by cluster | 200ms (+30ms each) | 320ms each |
| 4 | Legend | Fade in | 600ms | 200ms |

### 10.2 Easing
- Canvas/legend: `ease-enter` (`cubic-bezier(0, 0, 0.2, 1)`)
- Nodes: `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — subtle overshoot on settle
- Edges: `ease-standard` (`cubic-bezier(0.4, 0, 0.2, 1)`)

### 10.3 Hover Illumination

| Phase | Animation | Duration |
|-------|-----------|----------|
| Hovered node | Scale 1→1.08, border → gradient, glow on | 120ms |
| Neighbors | Scale 1→1.04, brighten, +40ms stagger | 120ms each |
| Illuminated edges | Opacity 0.5→1, color → gradient, width 1→1.5px | 200ms |
| Dimmed nodes/edges | Opacity → 0.35 / 0.15 | 200ms |
| Detail panel | Fade up + slide 8px | 200ms |

### 10.4 Hover Exit

| Phase | Animation | Duration |
|-------|-----------|----------|
| All elements | Return to default (faster than enter) | 120ms |
| Easing | `ease-exit` (`cubic-bezier(0.4, 0, 1, 1)`) | — |
| Detail panel | Fade out + slide down 8px | 120ms |

### 10.5 Reduced Motion
- Graph appears immediately (no staggered entrance).
- Illumination is instant (subgraph still highlights, no transition).
- Active nodes are static (no pulse).
- Learning nodes have solid (not dashed-rotating) rings.
- Detail panel appears instantly.

---

## 11. Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Graph height | 560px | 420px |
| Node size | 40–48px | 32–40px |
| Label | Inside or below | Below only (smaller nodes) |
| Edge length | `space-16` (64px) avg | `space-10` (40px) avg |
| Interaction | Hover | Tap |
| Detail panel | Below graph, full width | Below graph, full width |
| Legend | Top-right, inside canvas | Below stats row (horizontal) |
| Domain clusters | Spread, comfortable | Tighter, may overlap labels |

### 11.1 Mobile Graph

On mobile, the graph scales down and labels move below nodes to avoid overlap. The mesh remains a single connected graph — it does not collapse into a list. Tap replaces hover:

```
   ●        ●        ●
  TS       K8s      Py
   │        │
   ●────────●
  React    Go
```

### 11.2 Very Small Screens

On `xs` (<640px), if the graph becomes unreadable, a **fallback** renders: the mesh as a compact grouped list by domain, each skill a status-dotted row. The graph is the preferred view; the list is the floor, not the default.

---

## 12. Accessibility

| Concern | Solution |
|---------|----------|
| **Semantic structure** | `<section>`, `<h2>` per domain cluster in the semantic fallback |
| **Graph semantics** | Visual graph is `aria-hidden="true"`; a visually-hidden (`sr-only`) structured list provides the same data |
| **Keyboard** | Each node is focusable (`tabindex="0"`); focus triggers illumination + detail panel |
| **Focus** | Visible 2px accent ring, 2px offset, outside the node |
| **Status** | `aria-label="TypeScript, active, connected to React, Next.js, Node.js, Tailwind, Zod"` on each node |
| **Detail panel** | `aria-live="polite"` so screen readers announce the hovered/focused node's details |
| **Color independence** | Status conveyed by ring style (solid vs dashed) + size + text label, not color alone |
| **Motion** | Full reduced-motion fallback (instant, static) |
| **Contrast** | All text ≥ 4.5:1 against glass background |
| **Touch** | Tap targets ≥ 44px (nodes are 32–48px; hit area padded to 44px min) |

### 12.1 Dual-Content Strategy

Like the About and Projects pages, the Skills page renders **two versions**:
1. **Visual:** The topology graph (for sighted users).
2. **Semantic:** A visually-hidden (`sr-only`) structured HTML version — domains as `<h2>`, skills as `<li>` with status text and connection lists — for screen readers + SEO.

Both contain identical information; only the presentation differs.

---

## 13. SEO

| Element | Value |
|---------|-------|
| Title | `Skills — Kandarp Khandwala` |
| Description | `Service mesh of skills by Kandarp Khandwala — frontend, backend, DevOps, data, and design capabilities as a connected topology.` |
| OG title | `Skills by Kandarp Khandwala` |
| OG description | `A service mesh of capabilities — every skill a node, every relationship an edge.` |
| Structured data | `ItemList` of `Skill` (with `name`, `category`, `skillLevel` mapped from status) |

---

## 14. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Page header | `PageHeader`, `Eyebrow` |
| Mesh stats | `Stat`, `GlassPanel` |
| Topology graph | `GlassPanel` + custom graph canvas (SVG or R3F) |
| Node | Custom `SkillNode` + `StatusDot`, `LiveIndicator` (for active) |
| Edge | Custom `SkillEdge` (SVG path / line) |
| Status dot | `StatusDot`, `LiveIndicator` (for active) |
| Domain legend | Custom legend + `StatusDot` |
| Node detail panel | `GlassPanel` + `StatusDot`, custom field list |
| Entrance animation | `Reveal`, `FadeUp`, `Stagger` |
| Section wrapper | `Section`, `Container` |
| Semantic fallback | Visually hidden `<section>` with `Eyebrow`, headings, lists |

---

## 15. Design Rules Summary

1. **Skills = service mesh.** Each skill is a node; each relationship is an edge.
2. **Topology graph is the page.** A single, calm, explorable mesh — not a grid of cards.
3. **No progress bars.** Proficiency is a status: `active`, `idle`, `learning` — the OS's shared vocabulary.
4. **Hover traces connections.** Hovering a node illuminates its subgraph; the rest dims. This is the signature interaction.
5. **Minimal and calm.** Restraint over decoration — 1px edges, subtle tints, no clutter.
6. **Status by ring, not by bar.** Solid green = active, solid gray = idle, dashed amber = learning.
7. **Connected, not isolated.** Every node has edges; the mesh is one graph, not a list.
8. **Detail in flow, not modal.** The node detail panel appears below the graph — no overlay, no scrim.
9. **Keyboard = hover.** Focus illuminates the same subgraph; the graph is fully operable without a mouse.
10. **Reduced motion = static map.** Fully readable, zero animation — the mesh still highlights on focus.

---

_The Skills page doesn't list competencies — it maps a mesh. Every node is a service, every edge a connection, and every hover a trace through the topology of a career._
