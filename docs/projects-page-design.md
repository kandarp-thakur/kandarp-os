# Projects Page Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Terminal-native · DevOps-themed
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The Projects page treats the portfolio's body of work as a **container fleet** — each project is a *running container* listed in a `docker ps`-style table. The visitor scans containers the way an operator scans a host: by name, status, image, ports, and a one-line description. Clicking a container runs `docker inspect` — a detail panel slides in revealing the full manifest: architecture, layers (stack), exposed ports (links), volumes (metrics), and a changelog of commits that shipped it.

This is the "OS" identity made operational: the portfolio *is* an operating system, and the Projects page is its container runtime dashboard.

**One-line vision:** *Your projects aren't a gallery. They're a fleet of running containers — statused, ported, and inspectable.*

---

## 1. Page Layout

### 1.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─ Page Header ───────────────────────────────────────────┐   │
│   │  // PROJECTS                                            │   │
│   │  Container Fleet                                        │   │
│   │  $ docker ps                                             │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Fleet Stats (glass pills) ────────────────────────────┐    │
│   │  Containers  12   Running  8   Exited  3   Created  1  │    │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Filter Bar (glass) ────────────────────────────────────┐   │
│   │  [All] [Running] [Exited] [Created]    🔍 grep ...      │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Container Table (glass) ───────────────────────────────┐   │
│   │  CONTAINER   STATUS   STACK   PORTS   DESCRIPTION       │   │
│   │  ─────────────────────────────────────────────────────── │   │
│   │  ● kandarp-os   Up 2y   [Next][TS][R3F]   :3000 ↗       │   │
│   │    Portfolio platform — glassmorphism OS                 │   │
│   │  ─────────────────────────────────────────────────────── │   │
│   │  ● kube-guard    Up 1y   [Go][K8s][CRD]    :8080 ↗      │   │
│   │    Admission controller for cluster policy               │   │
│   │  ─────────────────────────────────────────────────────── │   │
│   │  ● devbox-cli   Exited  [Rust][Nix]        —             │   │
│   │    Reproducible dev environments from a manifest          │   │
│   │  ...                                                     │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Inspect Panel (slides in on click) ────────────────────┐    │
│   │  $ docker inspect kandarp-os                            │    │
│   │  [full manifest — see §6]                               │    │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Rules
- **Single column**, centered, `container-default` (1152px max).
- **Container table** is the primary content block — wide, glass, prominent.
- **Page header** is minimal — eyebrow + title + command subtitle.
- **Inspect panel** is an overlay drawer (right side on desktop, bottom sheet on mobile).
- **Vertical rhythm:** `space-8` between header and stats, `space-6` between stats and filter, `space-6` between filter and table.

---

## 2. Page Header

### 2.1 Anatomy

```
// PROJECTS
Container Fleet
$ docker ps
```

### 2.2 Styling

| Element | Spec |
|---------|------|
| Eyebrow | `// PROJECTS`, `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.15em |
| Title | `Container Fleet`, `text-h1` (36px), `font-bold`, `text-primary` |
| Subtitle | `$ docker ps`, `text-base`, `font-mono`, `text-secondary` |
| Alignment | Left-aligned |
| Animation | Fade up on scroll enter |

### 2.3 Fleet Stats

Below the header, a row of **fleet summary stats** (glass pills), mirroring the `docker ps` summary a host would report:

| Stat | Value | Label |
|------|-------|-------|
| Containers | 12 | Total projects |
| Running | 8 | Active / maintained |
| Exited | 3 | Archived / complete |
| Created | 1 | Planned / in progress |

| Property | Value |
|----------|-------|
| Layout | Horizontal row, `space-3` gap, wraps on mobile |
| Pill style | `glass-bg`, `radius-full`, `space-2 space-4` padding |
| Number | `font-mono`, `text-base`, `font-semibold`, `text-primary` |
| Label | `text-xs`, `text-tertiary`, `font-mono` |
| Running count | Colored `success` |
| Exited count | Colored `text-tertiary` |
| Created count | Colored `warning` |

---

## 3. Filter Bar

### 3.1 Concept

A `docker ps`-style filter row — segmented status filters plus a `grep`-style search. Lets the visitor narrow the fleet the way an operator filters containers.

### 3.2 Anatomy

```
[All] [Running] [Exited] [Created]          🔍 grep ...
```

### 3.3 Styling

| Element | Spec |
|---------|------|
| Container | `glass-bg`, `radius-xl` (16px), `space-2` padding, `border-default` + glass edge |
| Segmented filters | `PillNav` / `ToggleGroup` of status chips |
| Active filter | `accent-subtle` background, `accent-solid` text, `font-medium` |
| Inactive filter | transparent, `text-secondary`, hover `overlay-hover` |
| Filter font | `text-xs`, `font-mono`, uppercase |
| Search input | `flush` variant, leading magnifier icon, `text-sm`, placeholder `grep ...` |
| Search prefix | `🔍` or magnifier icon in `text-tertiary` |

### 3.4 Behavior

| Action | Result |
|--------|--------|
| Click status filter | Table filters to that status; "All" resets |
| Type in search | Live `grep` across name, stack, description (case-insensitive) |
| No results | `EmptyState`: `$ docker ps` → "No containers match." |
| Combined | Status filter AND search apply together |

---

## 4. The Container Table

### 4.1 Concept

The signature element. Each project is a **row** in a `docker ps`-style table — but each row is itself a **glass card** with hover lift, not a flat `<tr>`. The table reads like terminal output but feels like a premium dashboard.

### 4.2 Table Header

```
CONTAINER   STATUS   STACK   PORTS   DESCRIPTION
```

| Element | Spec |
|---------|------|
| Font | `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.1em |
| Layout | CSS grid: `auto 120px 1fr 140px 1fr` (desktop) |
| Divider | `border-subtle` below header |
| Sticky | Header sticks to top of table scroll region (if table scrolls) |

### 4.3 Container Row (Collapsed)

Each row is a clickable glass surface:

```
┌──────────────────────────────────────────────────────────────────┐
│ ● kandarp-os        Up 2y   [Next][TS][R3F]   :3000 ↗            │
│   Portfolio platform — glassmorphism OS                          │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Row Styling (Glass)

| Property | Value |
|----------|-------|
| Background | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `16px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-xl` (16px) |
| Shadow | `shadow-glass` |
| Hover | `shadow-glass-hover` + `translateY(-2px)` + `border-accent` |
| Padding | `space-4` (16px) |
| Gap between rows | `space-3` (12px) |
| Transition | `250ms ease-standard` |
| Cursor | `pointer` |

### 4.5 Row Columns

| Column | Content | Spec |
|--------|---------|------|
| **Container** | Status dot + name | Dot 10px (status-colored) + name `font-mono`, `text-sm`, `font-semibold`, `text-primary` |
| **Status** | `Up 2y` / `Exited` / `Created` | `text-xs`, `font-mono`, colored to match dot |
| **Stack** | Tech badges (image layers) | `Badge` pills, `text-xs`, max 3 visible + `+N` overflow |
| **Ports** | Exposed endpoints | `:3000 ↗` mono links, `text-xs`, `accent-solid` |
| **Description** | One-line summary | `text-sm`, `text-secondary`, full width, wraps to 2nd line |

### 4.6 Status Semantics

| Status | Dot Color | Label | Meaning |
|--------|-----------|-------|---------|
| `running` | `success` green, **pulsing** | `Up <duration>` | Active / maintained / deployed |
| `exited` | `text-tertiary` gray, solid | `Exited (<code>)` | Archived / complete / sunset |
| `created` | `warning` amber, solid | `Created` | Planned / in progress / not yet shipped |

### 4.7 Stack Badges (Image Layers)

Each project's tech stack is rendered as **image-layer badges** — the metaphor is Docker image layers stacked into the final image.

| Property | Value |
|----------|-------|
| Component | `Badge` (glass pill variant) |
| Background | `accent-subtle` |
| Text | `accent-solid`, `text-xs`, `font-mono` |
| Radius | `radius-full` |
| Padding | `space-1 space-2.5` |
| Gap | `space-1.5` |
| Max visible | 3, then `+N` overflow chip in `text-tertiary` |
| Hover (overflow) | Tooltip reveals remaining stack |

### 4.8 Ports (Exposed Endpoints)

Ports map to **external links** — the container's exposed endpoints:

| Port | Maps to | Icon |
|------|---------|------|
| `:3000` | Live demo URL | `↗` external |
| `:443` | Production site | `↗` external |
| `:8080` | API docs | `↗` external |
| `repo` | GitHub source | `↗` external |
| `docs` | Documentation | `↗` external |

| Property | Value |
|----------|-------|
| Format | `:PORT ↗` or `label ↗` in `font-mono` |
| Color | `accent-solid` |
| Size | `text-xs` |
| Hover | `accent-hover` + underline |
| Target | `_blank`, `rel="noopener"` |
| No ports | Render `—` in `text-quaternary` |

---

## 5. Interaction

### 5.1 Click → `docker inspect`

- **Click anywhere on a row** → opens the Inspect panel for that container.
- **Click a port link** → opens that endpoint directly (does NOT open inspect).
- **Only one container inspected at a time.**
- **Escape** or **click scrim** closes the panel.

### 5.2 Hover (Desktop)
- Row lifts (`translateY(-2px)`), shadow increases, border → accent.
- Status dot glows brighter (running dot pulses faster briefly).
- Cursor: `pointer` on row, `pointer` on port links.

### 5.3 Keyboard
- **Tab** moves between rows.
- **Enter/Space** opens inspect for focused row.
- **Escape** closes the inspect panel.
- Focus ring: 2px accent, 2px offset.
- Port links are individually focusable within a row.

### 5.4 Filter & Search
- Status filters and search are keyboard-accessible.
- Filtered rows animate out/in (`fade` + `height`, 200ms).
- Search is debounced (150ms).

---

## 6. The Inspect Panel (`docker inspect`)

### 6.1 Concept

When a container is clicked, a detail panel slides in revealing the full **container manifest** — formatted like real `docker inspect` JSON, but rendered as readable, structured glass sections. This is the "deep dive" view: architecture, stack layers, exposed ports, volumes (metrics), and a commit changelog.

### 6.2 Panel Anatomy

```
┌─ Inspect Panel (right drawer / bottom sheet) ─────────────────┐
│                                                                │
│  ● kandarp-os                                       [✕]        │
│  $ docker inspect kandarp-os                                  │
│                                                                │
│  ┌─ Manifest ─────────────────────────────────────────────┐   │
│  │  {                                                     │   │
│  │    "Name": "kandarp-os",                               │   │
│  │    "State": "running",                                 │   │
│  │    "Image": "kandarp-os:latest",                       │   │
│  │    "Created": "2024-06-01T00:00:00Z",                  │   │
│  │    "Status": "Up 2 years"                              │   │
│  │  }                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  📋 DESCRIPTION                                                │
│  A portfolio platform built as an operating system —           │
│  glassmorphism UI, terminal-native pages, 3D DevOps scenes.    │
│                                                                │
│  🛠 IMAGE LAYERS (STACK)                                       │
│  [Next.js 14] [TypeScript] [React Three Fiber] [Tailwind]      │
│  [Framer Motion] [Zod]                                         │
│                                                                │
│  🔌 EXPOSED PORTS                                              │
│  :3000  →  Live demo ↗                                         │
│  repo   →  github.com/kandarp-thakur/kandarp-os ↗              │
│  docs   →  kandarp-os.dev/docs ↗                               │
│                                                                │
│  📊 VOLUMES (METRICS)                                          │
│  Stars    1.2k    Commits   340                                │
│  Contrib    18    Issues     12                                │
│                                                                │
│  📜 COMMIT LOG (CHANGELOG)                                     │
│  ✓ v1.4  Shipped 3D DevOps constellation background            │
│  ✓ v1.3  Added terminal-native About page                      │
│  ✓ v1.2  Glassmorphism design system v2                        │
│  ✓ v1.1  Initial deployment timeline                           │
│  ✓ v1.0  Boot sequence — first commit                          │
│                                                                │
│  [Open Live ↗]  [View Source ↗]                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.3 Panel Styling

| Property | Desktop | Mobile |
|----------|---------|--------|
| Type | Right drawer | Bottom sheet |
| Width | 480px | 100% |
| Height | 100vh | 85vh (drag handle to full) |
| Background | `glass-bg-strong` (`rgba(255,255,255,0.80)`) | same |
| Backdrop blur | `24px` | `16px` |
| Border | `1px solid border-default` + glass edge (left edge) | top edge |
| Shadow | `shadow-glass-modal` | same |
| Radius | `radius-2xl` (left corners only) | `radius-2xl` (top corners only) |
| Padding | `space-6` | `space-5` |
| Scrim | `scrim` (`rgba(15,15,20,0.40)`) + `scrim-blur` 8px | same |
| Z-index | `z-overlay` (1200) | same |

### 6.4 Panel Header

| Element | Spec |
|---------|------|
| Status dot + name | Same as row; dot 12px, name `font-mono`, `text-base`, `font-semibold` |
| Command | `$ docker inspect <name>`, `text-xs`, `font-mono`, `text-tertiary` |
| Close button | `IconButton` (ghost), `✕`, top-right, `aria-label="Close inspect panel"` |

### 6.5 Manifest Block

A `docker inspect`-style JSON snippet at the top — the container's identity card:

```json
{
  "Name": "kandarp-os",
  "State": "running",
  "Image": "kandarp-os:latest",
  "Created": "2024-06-01T00:00:00Z",
  "Status": "Up 2 years"
}
```

| Property | Value |
|----------|-------|
| Container | `glass-bg-subtle`, `radius-lg`, `space-4` padding |
| Font | `font-mono`, `text-xs` |
| Keys | `text-tertiary` |
| Values | `text-primary` |
| String values | `accent-solid` |
| Braces/punctuation | `text-quaternary` |
| Copy button | `CopyButton` in corner (copies raw JSON) |

### 6.6 Expanded Sections

#### Description
- **Header:** `📋 DESCRIPTION`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Text:** `text-sm`, `text-secondary`, `leading-relaxed`, max 3 sentences

#### Image Layers (Stack)
- **Header:** `🛠 IMAGE LAYERS (STACK)`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Items:** `Badge` glass pills (same as row, but all visible — no overflow)
- **Layout:** Wrap, `space-1.5` gap
- **Order:** Bottom layer (base/runtime) → top layer (framework/UI), like image build order

#### Exposed Ports
- **Header:** `🔌 EXPOSED PORTS`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Format:** `:PORT  →  label ↗` or `label  →  url ↗`
- **Layout:** Vertical list, `space-2` between
- **Port:** `font-mono`, `text-sm`, `accent-solid`
- **Arrow:** `text-tertiary`
- **Link:** `text-sm`, `text-secondary`, hover `accent-solid` + underline
- **Target:** `_blank`, `rel="noopener"`

#### Volumes (Metrics)
- **Header:** `📊 VOLUMES (METRICS)`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Layout:** 2-column grid, `space-3` gap
- **Stat:** `Stat` component — number `font-mono`, `text-lg`, `font-semibold`, `text-primary`; label `text-xs`, `text-tertiary`
- **Common metrics:** Stars, Commits, Contributors, Issues, Downloads, PRs
- **Animated:** `AnimatedCounter` counts up on panel open

#### Commit Log (Changelog)
- **Header:** `📜 COMMIT LOG (CHANGELOG)`, `text-xs`, `font-mono`, `text-tertiary`, uppercase
- **Items:** Each prefixed with `✓` in `success` green
- **Version:** `v1.4`, `font-mono`, `text-xs`, `font-semibold`, `accent-solid`
- **Text:** `text-sm`, `text-secondary`
- **Format:** Achievement/release-focused (what shipped), not duties
- **Order:** Most recent first
- **Stagger:** Items fade in sequentially (+50ms each) on panel open

#### Action Footer
- **Primary:** `Open Live ↗` — gradient button, opens demo
- **Secondary:** `View Source ↗` — glass button, opens repo
- **Layout:** Horizontal, `space-3` gap, full-width on mobile

---

## 7. Container Data Model

Each project (container) has this structure:

| Field | Type | Example | Usage |
|-------|------|---------|-------|
| `id` | string | `kandarp-os` | Container name (slug) |
| `name` | string | `Kandarp OS` | Display name |
| `status` | enum | `running` \| `exited` \| `created` | Status dot + label |
| `statusDetail` | string | `Up 2y` / `Exited (0)` / `Created` | Status column text |
| `image` | string | `kandarp-os:latest` | Manifest image field |
| `created` | string | `2024-06-01` | Manifest created field (ISO date) |
| `description` | string | One-line summary | Row description column |
| `longDescription` | string | 2–3 sentences | Inspect description section |
| `stack` | string[] | `["Next.js","TypeScript"]` | Image layers / badges |
| `ports` | object[] | `[{port,label,url}]` | Exposed endpoints |
| `metrics` | object[] | `[{label,value}]` | Volumes / stats |
| `changelog` | object[] | `[{version,text}]` | Commit log |
| `links` | object[] | `[{label,url,variant}]` | Action footer |
| `exitCode` | number \| null | `0` / `null` | For exited containers |

---

## 8. Sample Containers

### 8.1 Container: `kandarp-os` (Running)

| Field | Value |
|-------|-------|
| ID | `kandarp-os` |
| Name | Kandarp OS |
| Status | `running` (green, pulsing) |
| Status detail | `Up 2y` |
| Image | `kandarp-os:latest` |
| Created | `2024-06-01` |
| Description | Portfolio platform — glassmorphism OS |
| Long description | A portfolio platform built as an operating system — glassmorphism UI, terminal-native pages, and 3D DevOps scenes. |
| Stack | Next.js 14, TypeScript, React Three Fiber, Tailwind, Framer Motion, Zod |
| Ports | `:3000` → Live demo, `repo` → GitHub, `docs` → Docs |
| Metrics | Stars 1.2k, Commits 340, Contrib 18, Issues 12 |
| Changelog | v1.4 3D DevOps background, v1.3 terminal About page, v1.2 design system v2, v1.1 deployment timeline, v1.0 boot sequence |

### 8.2 Container: `kube-guard` (Running)

| Field | Value |
|-------|-------|
| ID | `kube-guard` |
| Name | Kube Guard |
| Status | `running` (green, pulsing) |
| Status detail | `Up 1y` |
| Image | `kube-guard:v2` |
| Created | `2025-01-15` |
| Description | Admission controller for cluster policy |
| Stack | Go, Kubernetes, CRD, CEL, OpenTelemetry |
| Ports | `:8080` → API, `repo` → GitHub |
| Metrics | Stars 480, Commits 210, Contrib 7, Issues 24 |
| Changelog | v2.0 CEL policy engine, v1.2 webhook HA, v1.1 audit logging, v1.0 initial release |

### 8.3 Container: `devbox-cli` (Exited)

| Field | Value |
|-------|-------|
| ID | `devbox-cli` |
| Name | Devbox CLI |
| Status | `exited` (gray, solid) |
| Status detail | `Exited (0)` |
| Exit code | `0` |
| Image | `devbox-cli:v1` |
| Created | `2023-03-10` |
| Description | Reproducible dev environments from a manifest |
| Stack | Rust, Nix, WASM |
| Ports | `repo` → GitHub (archived) |
| Metrics | Stars 320, Commits 95, Contrib 3, Issues 0 |
| Changelog | v1.0 initial release, v0.9 manifest schema, v0.5 prototype |

### 8.4 Container: `infra-graph` (Created)

| Field | Value |
|-------|-------|
| ID | `infra-graph` |
| Name | Infra Graph |
| Status | `created` (amber, solid) |
| Status detail | `Created` |
| Image | `infra-graph:dev` |
| Created | `2026-06-20` |
| Description | Live infrastructure topology visualizer |
| Stack | TypeScript, D3, WebSocket, GraphQL |
| Ports | `—` (none yet) |
| Metrics | Stars 0, Commits 12, Contrib 1, Issues 0 |
| Changelog | v0.1 scaffolding + schema design |

---

## 9. Animation Choreography

### 9.1 Entrance (Scroll-Triggered)

The table rows animate in as the table scrolls into view:

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | Table header | Fade in | 0ms | 200ms |
| 2 | Rows | Fade up + stagger | +60ms each | 320ms each |
| 3 | Fleet stats | Fade up (parallel with header) | 0ms | 300ms |

### 9.2 Easing
- Rows: `ease-enter` (`cubic-bezier(0, 0, 0.2, 1)`)
- Stagger: 60ms between rows
- Panel slide: `ease-smooth` (`cubic-bezier(0.45, 0, 0.15, 1)`)

### 9.3 Inspect Panel Open

| Phase | Animation | Duration |
|-------|-----------|----------|
| Scrim | Fade in (0→1) | 200ms |
| Panel | Slide in from right (translateX 100%→0) | 320ms |
| Manifest | Fade in | 200ms (after 100ms) |
| Sections | Fade up + stagger (+60ms each) | 240ms each |
| Metrics | Count up | 800ms |
| Changelog | Fade in + stagger (+50ms each) | 200ms each |

### 9.4 Inspect Panel Close

| Phase | Animation | Duration |
|-------|-----------|----------|
| Panel | Slide out (translateX 0→100%) | 250ms |
| Scrim | Fade out (1→0) | 200ms |
| Easing | `ease-exit` (`cubic-bezier(0.4, 0, 1, 1)`) | — |

### 9.5 Filter / Search Transition

| Phase | Animation | Duration |
|-------|-----------|----------|
| Removed rows | Fade out + collapse height | 200ms |
| Remaining rows | Re-flow (layout shift) | 200ms |
| New matches | Fade in + expand | 200ms |

### 9.6 Running Container Pulse

Running containers' status dots **pulse** (same as active deployment on Experience page):

| Property | Value |
|----------|-------|
| Animation | Scale 1 → 1.3 → 1 + opacity 1 → 0.6 → 1 |
| Duration | 2s |
| Easing | `ease-smooth` |
| Loop | Infinite |
| Reduced motion | Disabled (static dot) |

### 9.7 Reduced Motion
- All rows appear immediately (no scroll-triggered animation).
- Inspect panel opens instantly (no slide).
- Metrics show final value (no count-up).
- Changelog appears all at once (no stagger).
- Running dot is static (no pulse).

---

## 10. Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Table layout | 5-column grid | Stacked card (name+status / stack / ports / desc) |
| Row padding | `space-4` | `space-4` |
| Stack badges | 3 + overflow | 2 + overflow |
| Ports | Inline row | Wrap, tighter |
| Inspect panel | Right drawer (480px) | Bottom sheet (85vh) |
| Manifest JSON | Full, formatted | Same (mono scales) |
| Metrics grid | 2 columns | 2 columns (compact) |
| Filter bar | Inline (filters + search) | Stacked (filters above search) |
| Fleet stats | Single row | Wrap to 2x2 |

### 10.1 Mobile Row Layout

On mobile, the 5-column grid collapses to a stacked card:

```
┌────────────────────────────────────────────┐
│ ● kandarp-os                    Up 2y      │
│ [Next][TS][R3F]                            │
│ :3000 ↗  repo ↗                           │
│ Portfolio platform — glassmorphism OS      │
└────────────────────────────────────────────┘
```

### 10.2 Mobile Inspect Panel

On mobile, the panel becomes a **bottom sheet**:
- Slides from bottom (translateY 100%→0).
- 85vh height, drag handle at top to dismiss or expand.
- Top corners rounded (`radius-2xl`).
- Same content, tighter padding (`space-5`).

---

## 11. Accessibility

| Concern | Solution |
|---------|----------|
| **Semantic structure** | `<section>`, `<h2>` per project, `<ul>` for stack/changelog |
| **Table semantics** | Use `<table>` with `<thead>`/`<tbody>` OR `role="table"` on grid; rows are `role="row"` + `tabindex="0"` |
| **Inspect panel** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to container name |
| **Focus trap** | `FocusTrap` active while panel open; focus returns to row on close |
| **Status** | `aria-label="Status: running"` on status dot; color + text label, not color alone |
| **Filter** | `aria-pressed` on status filter chips; search has `<label>` |
| **Keyboard** | Rows focusable + Enter/Space opens inspect; Escape closes; Tab traverses ports |
| **Screen reader** | Visual `docker inspect` JSON is decorative (`aria-hidden`); semantic HTML duplicate provides the same data |
| **Motion** | Full reduced-motion fallback (instant, static) |
| **Contrast** | All text ≥ 4.5:1 against glass background |

### 11.1 Dual-Content Strategy
Like the About page, the inspect panel renders **two versions**:
1. **Visual:** The `docker inspect`-style manifest + sections (for sighted users).
2. **Semantic:** A visually-hidden (`sr-only`) structured HTML version (headings, lists, links) for screen readers + SEO.

Both contain identical information; only the presentation differs.

---

## 12. SEO

| Element | Value |
|---------|-------|
| Title | `Projects — Kandarp Khandwala` |
| Description | `Container fleet of projects by Kandarp Khandwala — running, archived, and in-progress builds.` |
| OG title | `Projects by Kandarp Khandwala` |
| OG description | `A fleet of running containers — full-stack apps, DevOps tools, and 3D experiences.` |
| Structured data | `CollectionPage` + `SoftwareApplication` per project (with `applicationCategory`, `operatingSystem: Web`) |

---

## 13. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Page header | `PageHeader`, `Eyebrow` |
| Fleet stats | `Stat`, `GlassPanel` |
| Filter bar | `ToggleGroup` / `PillNav`, `InputSearch` |
| Container table | `GlassPanel` + custom grid rows |
| Container row | Custom row + `StatusDot`, `LiveIndicator`, `Badge`, `ExternalLink` |
| Status dot | `StatusDot`, `LiveIndicator` (for running) |
| Stack badges | `Badge` |
| Ports | `ExternalLink` (mono-styled) |
| Inspect panel | `Drawer` (desktop) / `BottomSheet` (mobile) |
| Manifest block | `CodeBlock` (JSON) + `CopyButton` |
| Metrics | `Stat`, `AnimatedCounter` |
| Changelog | Custom list + `Stagger` / `StaggerItem` |
| Action footer | `Button` (primary + glass) |
| Entrance animation | `Reveal`, `FadeUp`, `Stagger` |
| Focus trap | `FocusTrap` |
| Section wrapper | `Section`, `Container` |
| Empty state | `EmptyState` |

---

## 14. Design Rules Summary

1. **Projects = container fleet.** Each project is a running container with status, image, ports.
2. **`docker ps` table.** The primary view is a statused, ported, stack-badged table of containers.
3. **Click = `docker inspect`.** Clicking a container opens a manifest-style detail panel.
4. **Glass rows, not flat rows.** Each table row is a hover-lifting glass card.
5. **Status semantics.** Running = green pulsing; exited = gray solid (with exit code); created = amber solid.
6. **Stack = image layers.** Tech badges are the container's layered image.
7. **Ports = exposed endpoints.** Live demo, repo, docs — each a `:PORT ↗` link.
8. **Metrics = volumes.** Stars, commits, contributors rendered as mounted volumes.
9. **Changelog = commit log.** Versioned, achievement-focused, most-recent-first.
10. **Filter + grep.** Status segmented filters and a `grep` search narrow the fleet.
11. **Drawer on desktop, bottom sheet on mobile.** Inspect panel adapts to viewport.
12. **Reduced motion = static.** Fully readable, zero animation.

---

_The Projects page doesn't show a gallery — it runs a fleet. Each project is a container, each click an inspect, and the table is the runtime that hosts a body of work._
