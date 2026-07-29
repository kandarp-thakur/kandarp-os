# Blog Page Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Terminal-native · DevOps-themed
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The Blog page treats writing as a **systemd journal** — each post is a *journal entry* in a `journalctl` log stream. The visitor reads the blog the way an operator reads a journal: by timestamp, by unit (category), by priority, and by message. The index is a reverse-chronological log stream of entries; clicking an entry opens the full post — the entry's complete message body, rendered from Markdown.

Categories are **systemd units** (`devops.service`, `docker.service`, `linux.service`…). Tags are **log tags** (`#docker`, `#k8s`). Search is `journalctl --grep`. Reading time is a metadata field on each entry. The post page carries a sticky **table of contents** (the entry's structure) and a **related entries** section (correlated by shared tags, like `journalctl --grep` for overlapping terms).

This is the "OS" identity made editorial: the portfolio *is* an operating system, and the Blog page is its journal — a persistent, queryable log of everything written, thought, and shipped.

**One-line vision:** *Your writing isn't a feed. It's a journal — every post an entry, every category a unit, every search a grep.*

---

## 1. Page Layout

### 1.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─ Page Header ───────────────────────────────────────────┐   │
│   │  // JOURNAL                                              │   │
│   │  Engineering Journal                                     │   │
│   │  $ journalctl --reverse                                  │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Journal Stats (glass pills) ────────────────────────────┐   │
│   │  Entries  42   Units  10   Tags  86   Words  128k        │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Filter Bar (glass) ────────────────────────────────────┐   │
│   │  [All] [devops] [docker] [linux] ...    🔍 grep ...      │   │
│   │  #docker  #k8s  #rolling-updates  #terraform  ...         │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Journal Stream (glass) ────────────────────────────────┐    │
│   │  Jul 06 2024  devops.service[1042]   ● notice   8 min   │    │
│   │  Zero-Downtime Deployments with Kubernetes               │    │
│   │  How rolling updates keep your fleet alive during...     │    │
│   │  #docker  #k8s  #rolling-updates                         │    │
│   │  ─────────────────────────────────────────────────────── │    │
│   │  Jun 18 2024  docker.service[1039]   ● info     5 min   │    │
│   │  Layer Caching, Explained                                │    │
│   │  Why your builds are slow and how to fix them...         │    │
│   │  #docker  #build-cache  #multi-stage                    │    │
│   │  ...                                                     │    │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Load More ─────────────────────────────────────────────┐   │
│   │  $ journalctl --reverse --cursor=...            [Load]   │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Rules
- **Single column**, centered, `container-default` (1152px max).
- **Journal stream** is the primary content block — wide, glass, prominent.
- **Page header** is minimal — eyebrow + title + command subtitle.
- **Filter bar** sits above the stream — unit chips, `grep` search, and a tag cloud.
- **Vertical rhythm:** `space-8` between header and stats, `space-6` between stats and filter, `space-6` between filter and stream.

---

## 2. Page Header

### 2.1 Anatomy

```
// JOURNAL
Engineering Journal
$ journalctl --reverse
```

### 2.2 Styling

| Element | Spec |
|---------|------|
| Eyebrow | `// JOURNAL`, `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.15em |
| Title | `Engineering Journal`, `text-h1` (36px), `font-bold`, `text-primary` |
| Subtitle | `$ journalctl --reverse`, `text-base`, `font-mono`, `text-secondary` |
| Alignment | Left-aligned |
| Animation | Fade up on scroll enter |

### 2.3 Journal Stats

Below the header, a row of **journal summary stats** (glass pills), mirroring the summary `journalctl --disk-usage` would report:

| Stat | Value | Label |
|------|-------|-------|
| Entries | 42 | Total posts |
| Units | 10 | Categories |
| Tags | 86 | Unique tags |
| Words | 128k | Total written |

| Property | Value |
|----------|-------|
| Layout | Horizontal row, `space-3` gap, wraps on mobile |
| Pill style | `glass-bg`, `radius-full`, `space-2 space-4` padding |
| Number | `font-mono`, `text-base`, `font-semibold`, `text-primary` |
| Label | `text-xs`, `text-tertiary`, `font-mono` |

---

## 3. Filter Bar

### 3.1 Concept

A `journalctl`-style filter row — unit (category) chips, a `grep`-style search, and a tag cloud. Lets the visitor narrow the journal the way an operator filters log entries: by unit, by priority, by grep, and by tag.

### 3.2 Anatomy

```
[All] [devops] [docker] [linux] [networking] [aws] [python] ...     🔍 grep ...
#docker  #k8s  #rolling-updates  #terraform  #systemd  #cilium  ...
```

### 3.3 Unit Chips (Categories)

| Property | Value |
|----------|-------|
| Container | `glass-bg`, `radius-xl` (16px), `space-2` padding, `border-default` + glass edge |
| Chips | `PillNav` / `ToggleGroup` of unit names |
| Active chip | `accent-subtle` background, `accent-solid` text, `font-medium` |
| Inactive chip | transparent, `text-secondary`, hover `overlay-hover` |
| Chip font | `text-xs`, `font-mono`, lowercase |
| Overflow | Horizontal scroll on mobile; `+N more` popover on desktop if > 8 units |

### 3.4 Search (`grep`)

| Property | Value |
|----------|-------|
| Input | `flush` variant, leading magnifier icon, `text-sm`, placeholder `grep ...` |
| Prefix | `🔍` or magnifier icon in `text-tertiary` |
| Behavior | Live `grep` across title, excerpt, tags, and unit (case-insensitive) |
| Debounce | 150ms |

### 3.5 Tag Cloud

A row of **popular tags** below the unit chips — the journal's most frequent log tags:

| Property | Value |
|----------|-------|
| Container | Same glass bar, below the unit row, `border-subtle` divider above |
| Tag | `#tag` mono pill, `text-xs`, `text-tertiary`, hover `accent-solid` + `overlay-hover` |
| Layout | Wrap, `space-1.5` gap |
| Max visible | 12, then `+N tags` link opens a full tag index |
| Active tag | `accent-subtle` background, `accent-solid` text |

### 3.6 Behavior

| Action | Result |
|--------|--------|
| Click unit chip | Stream filters to that unit; "All" resets |
| Click tag | Stream filters to entries containing that tag |
| Type in search | Live `grep` across title, excerpt, tags, unit |
| Combined | Unit AND tag AND search apply together |
| No results | `EmptyState`: `$ journalctl` → "No entries match." |

---

## 4. The Journal Stream

### 4.1 Concept

The signature element. Each post is a **journal entry** in a `journalctl`-style log stream — but each entry is itself a **glass card** with hover lift, not a flat log line. The stream reads like terminal output but feels like a premium reading dashboard.

### 4.2 Stream Container

| Property | Value |
|----------|-------|
| Background | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `16px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-2xl` (20px) |
| Shadow | `shadow-glass` |
| Padding | `space-4` (16px) |
| Overflow | Visible (entries stack vertically) |

### 4.3 Stream Header

A mono header row inside the stream container, like a `journalctl` column header:

```
TIMESTAMP   UNIT   PRIORITY   ENTRY
```

| Element | Spec |
|---------|------|
| Font | `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.1em |
| Layout | Flex row, `space-4` gaps |
| Divider | `border-subtle` below header |
| Sticky | Header sticks to top of stream scroll region (if stream scrolls) |

---

## 5. Journal Entry (Collapsed)

### 5.1 Concept

Each post is a **journal entry** — a glass card in the stream with a `journalctl`-style metadata header, a title, an excerpt, and tags. Clicking the entry navigates to the full post.

### 5.2 Entry Anatomy

```
┌─ Journal Entry (glass) ─────────────────────────────────────────┐
│                                                                  │
│  Jul 06 2024   devops.service[1042]   ● notice      8 min read   │
│                                                                  │
│  Zero-Downtime Deployments with Kubernetes                       │
│  How rolling updates keep your fleet alive during releases —     │
│  a field guide to update strategies, health checks, and...       │
│                                                                  │
│  #docker  #k8s  #rolling-updates                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Entry Styling (Glass)

| Property | Value |
|----------|-------|
| Background | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `16px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-xl` (16px) |
| Shadow | `shadow-glass` |
| Hover | `shadow-glass-hover` + `translateY(-2px)` + `border-accent` |
| Padding | `space-4` (16px) |
| Gap between entries | `space-3` (12px) |
| Transition | `250ms ease-standard` |
| Cursor | `pointer` |

### 5.4 Entry Metadata Row

A `journalctl`-style header line at the top of each entry:

| Element | Content | Spec |
|---------|---------|------|
| **Timestamp** | Publish date | `Jul 06 2024`, `text-xs`, `font-mono`, `text-tertiary` |
| **Unit** | Category as systemd unit | `devops.service[1042]`, `text-xs`, `font-mono`, `accent-solid` |
| **PID** | Post ID | `[1042]`, `text-xs`, `font-mono`, `text-quaternary` |
| **Priority** | Post level | Dot + label, `text-xs`, `font-mono` (see §7) |
| **Reading time** | Computed from word count | `8 min read`, `text-xs`, `font-mono`, `text-tertiary`, right-aligned |

### 5.5 Entry Title

| Property | Value |
|----------|-------|
| Text | Post title |
| Font | `text-lg` (18px), `font-semibold`, `text-primary` |
| Margin | `space-2` above metadata row |
| Hover | `accent-solid` |
| Max lines | 2 (truncated with `…` if long) |

### 5.6 Entry Excerpt

| Property | Value |
|----------|-------|
| Text | First 1–2 sentences of the post (plain text, markdown stripped) |
| Font | `text-sm`, `text-secondary`, `leading-relaxed` |
| Max lines | 2 (truncated with `…`) |
| Margin | `space-1.5` below title |

### 5.7 Entry Tags

| Property | Value |
|----------|-------|
| Component | `#tag` mono pills |
| Font | `text-xs`, `font-mono`, `text-tertiary` |
| Background | `accent-subtle` |
| Text color | `accent-solid` |
| Radius | `radius-full` |
| Padding | `space-1 space-2.5` |
| Gap | `space-1.5` |
| Max visible | 4, then `+N` overflow chip in `text-quaternary` |
| Hover (overflow) | Tooltip reveals remaining tags |
| Margin | `space-3` above (below excerpt) |

---

## 6. Categories (Systemd Units)

### 6.1 Concept

Categories are **systemd units** — the `journalctl --unit` filter. Each category maps to a `<name>.service` unit. This is the authentic `journalctl` vocabulary: you don't pick a "category," you filter by unit.

### 6.2 Unit Registry

| Category | Unit | Tint | Description |
|----------|------|------|-------------|
| DevOps | `devops.service` | `accent-solid` (`#6366F1`) | CI/CD, pipelines, automation, culture |
| Docker | `docker.service` | `info` (`#3B82F6`) | Containers, images, builds, compose |
| Linux | `linux.service` | `success` (`#10B981`) | Kernel, shell, filesystem, systemd |
| Networking | `networking.service` | `info` (`#3B82F6`) | TCP/IP, DNS, routing, service mesh |
| AWS | `aws.service` | `warning` (`#F59E0B`) | Cloud, IaC, services, architecture |
| Python | `python.service` | `success` (`#10B981`) | Language, libraries, patterns |
| Career | `career.service` | `accent-solid` (`#6366F1`) | Growth, roles, mentoring, leadership |
| Life | `life.service` | `#EC4899` (pink) | Reflections, philosophy, off-topic |
| Research | `research.service` | `info` (`#3B82F6`) | Experiments, deep dives, papers |
| Support | `support.service` | `warning` (`#F59E0B`) | On-call, incidents, postmortems, SRE |

### 6.3 Unit Styling

| Property | Value |
|----------|-------|
| Format | `<name>.service` in `font-mono` |
| Color | Unit tint (subtle — appears on the unit text in the metadata row) |
| Hover | Brightens to full tint |
| Click | Filters the stream to that unit |

---

## 7. Priority Semantics

### 7.1 Concept

Each entry carries a **syslog priority** — the same vocabulary `journalctl --priority` uses. Priority is a subtle indicator of the entry's nature, not a quality score. It is filterable and color-coded, consistent with the OS's shared status vocabulary.

### 7.2 Priority Levels

| Priority | Code | Dot Color | Meaning | Visual |
|----------|------|-----------|---------|--------|
| `info` | 6 | `text-tertiary` gray, solid | Standard post | Default — no special emphasis |
| `notice` | 5 | `accent-solid`, solid | Featured / highlighted | Subtle accent border-left on entry |
| `debug` | 7 | `info` blue, solid | Deep technical dive | `#` prefix on title (optional) |

### 7.3 Priority Display

| Property | Value |
|----------|-------|
| Format | `● <level>` in `font-mono`, `text-xs` |
| Dot | 8px circle, priority-colored |
| Label | Lowercase, `text-tertiary` (or tinted for notice/debug) |
| Filter | Clickable in an optional priority filter row (hidden by default; toggle via `--priority` button) |

### 7.4 Featured Entries (`notice`)

Entries with `notice` priority get a subtle **accent left-border** (3px `accent-solid`) to stand out in the stream — like a flagged log line:

| Property | Value |
|----------|-------|
| Border-left | `3px solid accent-solid` |
| Background | `accent-subtle` tint (very faint) |
| Shadow | `shadow-glass` (slightly stronger) |

---

## 8. Tags

### 8.1 Concept

Tags are **log tags** — the `#tag` markers that annotate journal entries. They are cross-cutting (a post can have tags from multiple units) and are the primary axis for **related posts** correlation.

### 8.2 Tag Styling

| Property | Value |
|----------|-------|
| Format | `#tag` (kebab-case, no spaces) |
| Font | `font-mono`, `text-xs` |
| Background | `accent-subtle` |
| Text | `accent-solid` |
| Radius | `radius-full` |
| Padding | `space-1 space-2.5` |
| Hover | `accent-hover` + `overlay-hover` |
| Click | Filters stream to entries with that tag |

### 8.3 Tag Index Page

A dedicated `/blog/tags` view (or modal) listing all tags as a weighted cloud:

| Property | Value |
|----------|-------|
| Layout | Centered, wrap, `space-2` gap |
| Weight | Font size scales with post count (`text-xs` → `text-lg`) |
| Color | `text-secondary`, hover `accent-solid` |
| Count | Small `font-mono` count badge after each tag |

---

## 9. Reading Time

### 9.1 Concept

Reading time is a **metadata field** on each journal entry — computed from the post's word count. It appears in the entry's metadata row and on the post page header.

### 9.2 Computation

| Property | Value |
|----------|-------|
| Formula | `ceil(wordCount / 200)` minutes |
| Source | Rendered markdown body (excluding code blocks' non-prose) |
| Minimum | `1 min read` (never `0 min`) |
| Rounding | Up to nearest minute |

### 9.3 Display

| Property | Value |
|----------|-------|
| Format | `8 min read` |
| Font | `font-mono`, `text-xs`, `text-tertiary` |
| Position | Entry metadata row (right-aligned); post page header |
| Icon | Optional `⏱` or clock icon in `text-quaternary` |

---

## 10. Interaction

### 10.1 Click → Post Page
- **Click anywhere on an entry** → navigates to the full post (`/blog/<slug>`).
- **Click a tag** → filters the stream to that tag (does NOT navigate).
- **Click a unit chip** → filters the stream to that unit (does NOT navigate).
- **Middle-click / Cmd+click** → opens post in new tab.

### 10.2 Hover (Desktop)
- Entry lifts (`translateY(-2px)`), shadow increases, border → accent.
- Title brightens to `accent-solid`.
- Cursor: `pointer` on entry, `pointer` on tags/units.

### 10.3 Keyboard
- **Tab** moves between entries.
- **Enter** navigates to the focused entry's post.
- Tags and unit chips are individually focusable within an entry.
- Focus ring: 2px accent, 2px offset.

### 10.4 Filter & Search
- Unit chips, tags, and search are keyboard-accessible.
- Filtered entries animate out/in (`fade` + `height`, 200ms).
- Search is debounced (150ms).
- Active filters show as a removable chip row above the stream.

### 10.5 Load More / Pagination
- **Initial load:** 10 entries.
- **Load more:** A `journalctl --cursor`-style button at the stream bottom:
  ```
  $ journalctl --reverse --cursor=...
  [Load 10 more entries]
  ```
- **Infinite scroll** optional (IntersectionObserver on the load-more button).
- **URL state:** Filters, search, and page reflected in query params (`?unit=docker&tag=k8s&q=deploy&page=2`) for shareable filtered views.

---

## 11. The Blog Post Page

### 11.1 Concept

Clicking a journal entry opens the **full post** — the entry's complete message body, rendered from Markdown. The post page is a single journal entry expanded to its full content, with a sticky table of contents and a related-entries section.

### 11.2 Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← journalctl (back to stream)                                   │
│                                                                  │
│  ┌─ Entry Header ────────────────────────────────────────────┐   │
│  │  Jul 06 2024 · devops.service[1042] · ● notice · 8 min    │   │
│  │  Zero-Downtime Deployments with Kubernetes                │   │
│  │  #docker  #k8s  #rolling-updates                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ TOC (sticky) ─┐  ┌─ Markdown Content ────────────────────┐   │
│  │  ON THIS PAGE  │  │                                       │   │
│  │  ────────────  │  │  ## The Problem                        │   │
│  │  The Problem   │  │  Rolling updates replace pods...       │   │
│  │  Rolling Upd…  │  │                                       │   │
│  │  Health Checks │  │  ## Rolling Updates                    │   │
│  │  Surge & Drain │  │  ...                                  │   │
│  │  Pitfalls      │  │                                       │   │
│  │  Conclusion    │  │  ### maxSurge                         │   │
│  └────────────────┘  │  ...                                  │   │
│                      └────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ Related Entries ────────────────────────────────────────┐    │
│  │  $ journalctl --grep "kubernetes"                        │    │
│  │  [entry]  [entry]  [entry]                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Post Footer ────────────────────────────────────────────┐   │
│  │  ← Previous entry          Next entry →                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 11.3 Layout Rules
- **Two-column** on desktop: sticky TOC (left, ~240px) + content (right, fluid).
- **Single column** on mobile: TOC collapses into a disclosure above content.
- **Content max width:** `prose` measure (~72ch / 680px) for readability.
- **Vertical rhythm:** `space-8` between header and content, `space-12` between content and related.

---

## 12. Post Header

### 12.1 Anatomy

```
Jul 06 2024 · devops.service[1042] · ● notice · 8 min read
Zero-Downtime Deployments with Kubernetes
#docker  #k8s  #rolling-updates
```

### 12.2 Styling

| Element | Spec |
|---------|------|
| Container | `glass-bg`, `radius-2xl` (20px), `space-6` padding, `border-default` + glass edge |
| Metadata row | `font-mono`, `text-xs`, `text-tertiary`, `·` separators |
| Unit | `accent-solid`, clickable (filters stream on click) |
| Priority | Dot + label, priority-colored |
| Reading time | `text-tertiary` |
| Title | `text-h1` (36px), `font-bold`, `text-primary`, `space-3` above |
| Tags | `#tag` pills (same as entry), `space-3` below title |
| Back link | `← journalctl`, `text-sm`, `font-mono`, `text-tertiary`, hover `accent-solid`, above header |

### 12.3 Featured Post Accent

If the post is `notice` priority, the header gets the accent left-border (3px `accent-solid`), matching the stream entry.

---

## 13. Table of Contents (TOC)

### 13.1 Concept

The TOC is the **entry's structure** — auto-generated from the post's Markdown headings (H2, H3). It is a sticky sidebar on desktop and a collapsible disclosure on mobile. The active section highlights as the reader scrolls (scrollspy).

### 13.2 TOC Anatomy

```
ON THIS PAGE
────────────
The Problem
Rolling Updates
  maxSurge
  maxUnavailable
Health Checks
Surge & Drain
Pitfalls
Conclusion
```

### 13.3 TOC Styling

| Property | Value |
|----------|-------|
| Container | `glass-bg-subtle`, `radius-lg`, `space-4` padding |
| Position | Sticky, `top-24` (below navbar), left column |
| Width | ~240px desktop; full-width disclosure on mobile |
| Header | `ON THIS PAGE`, `text-2xs`, `font-mono`, `text-tertiary`, uppercase, tracking 0.1em |
| Divider | `border-subtle` below header |
| Items | `text-sm`, `text-secondary`, `font-mono`, hover `accent-solid` |
| H2 items | No indent, `font-medium` |
| H3 items | `space-4` left indent, `text-tertiary` |
| Active item | `accent-solid`, `font-medium`, left accent bar (2px) |
| Links | Anchor to heading `id`; smooth scroll on click |
| Max height | `70vh` with overflow-y auto if long |

### 13.4 Scrollspy

| Property | Value |
|----------|-------|
| Trigger | Heading enters viewport (IntersectionObserver, rootMargin top -40%) |
| Active state | TOC item matching the topmost visible heading highlights |
| Transition | Color + accent bar, `duration-fast` (120ms), `ease-standard` |
| Reduced motion | Active state still updates (no smooth scroll; instant jump on click) |

### 13.5 Mobile TOC

On mobile, the TOC becomes a **collapsible disclosure** at the top of the content:

| Property | Value |
|----------|-------|
| Trigger | `▼ On this page` toggle, `font-mono`, `text-sm`, `text-tertiary` |
| Default | Collapsed |
| Expanded | Full list, `space-2` padding, `glass-bg-subtle` |
| Chevron | Rotates 180° on expand |

### 13.6 Empty TOC

If the post has fewer than 3 headings, the TOC is **hidden** (not worth a sidebar for a short post). The content takes full width.

---

## 14. Markdown Content

### 14.1 Concept

The post body is **Markdown** — authored in `.md` files, rendered to styled HTML. The rendering follows the design system: glassmorphism, mono accents, terminal-native code blocks. This is where the "OS" identity meets long-form writing.

### 14.2 Content Container

| Property | Value |
|----------|-------|
| Max width | `prose` measure (~72ch / 680px) |
| Font | `font-sans` (Inter), `text-base` (16px), `text-primary` |
| Line height | 1.75 (generous for readability) |
| Color | `text-primary` for body, `text-secondary` for muted |
| Margin | `space-8` below header, `space-12` above related |

### 14.3 Typography Scale

| Element | Spec |
|---------|------|
| H2 (`##`) | `text-2xl` (24px), `font-bold`, `text-primary`, `space-8` above, `space-4` below, `border-subtle` bottom on hover |
| H3 (`###`) | `text-xl` (20px), `font-semibold`, `text-primary`, `space-6` above, `space-3` below |
| H4 (`####`) | `text-lg` (18px), `font-semibold`, `text-primary`, `space-5` above, `space-2` below |
| Paragraph | `text-base`, `text-secondary`, `leading-relaxed`, `space-4` below |
| Strong | `font-semibold`, `text-primary` |
| Emphasis | `italic`, `text-secondary` |
| Inline code | `font-mono`, `text-sm`, `accent-solid`, `accent-subtle` background, `radius-sm`, `space-0.5` padding |
| Link | `accent-solid`, underline, hover `accent-hover` |
| Blockquote | See §14.5 |
| Code block | See §14.6 |
| List | `text-base`, `text-secondary`, `space-2` between items |
| HR (`---`) | `border-subtle`, `space-8` margin |

### 14.4 Heading Anchors

| Property | Value |
|----------|-------|
| Anchor | Each H2/H3 gets an `id` (slugified text) |
| Hover | `#` link icon appears to the left on hover, `text-quaternary` → `accent-solid` |
| Click | Smooth-scrolls to the heading; updates URL hash |

### 14.5 Blockquotes

Blockquotes render as **log output** — consistent with the journal metaphor:

```
┌────────────────────────────────────────────┐
│ ▸ "A rolling update is a controlled fire." │
│   — SRE proverb                            │
└────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `glass-bg-subtle`, `radius-lg`, `space-4` padding, `border-left` 3px `accent-solid` |
| Marker | `▸` in `accent-solid`, `font-mono` |
| Text | `text-base`, `text-secondary`, `italic` |
| Attribution | `text-sm`, `font-mono`, `text-tertiary`, `—` prefix |

### 14.6 Code Blocks

Code blocks render as **terminal output** — mini terminal windows inside the post:

```
┌─ ● ● ●  bash ──────────────────────────────┐
│ $ kubectl rollout status deployment/api    │
│ deployment "api" successfully rolled out   │
└────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `glass-bg-strong`, `radius-lg`, `border-default` + glass edge |
| Header | Traffic lights (3 dots) + language label, `font-mono`, `text-xs`, `text-tertiary` |
| Body | `font-mono`, `text-sm`, `text-primary`, `space-4` padding, overflow-x auto |
| Syntax highlighting | Token colors: keywords `accent-solid`, strings `success`, comments `text-quaternary`, numbers `warning` |
| Copy button | `CopyButton` in header corner (copies raw code) |
| Language | Detected from fence info string (```bash, ```yaml, etc.) |
| Line numbers | Optional, `text-quaternary`, `text-xs`, right-aligned gutter |

### 14.7 Other Elements

| Element | Spec |
|---------|------|
| Unordered list | `•` marker in `accent-solid`, `space-2` between items |
| Ordered list | `1.` mono numerals in `accent-solid` |
| Table | `glass-bg-subtle`, `border-subtle` rows, `font-mono` headers `text-tertiary`, `text-sm` cells |
| Image | `radius-lg`, `shadow-glass`, `caption` below in `text-xs`, `text-tertiary`, `font-mono` |
| Footnote | Superscript link, detail at bottom in `text-sm`, `text-tertiary` |

### 14.8 Reading Progress

A **reading progress bar** at the top of the viewport (below navbar):

| Property | Value |
|----------|-------|
| Position | Fixed, `top-0`, full width, `z-content` |
| Height | 2px |
| Color | `accent-gradient` |
| Width | Scales with scroll progress (0→100%) |
| Reduced motion | Still updates (no transition) |

---

## 15. Related Entries

### 15.1 Concept

At the bottom of each post, a **related entries** section — correlated by shared tags and unit, like `journalctl --grep` for overlapping terms. This keeps the reader in the journal, hopping between connected entries.

### 15.2 Anatomy

```
┌─ Related Entries ───────────────────────────────────────────┐
│  $ journalctl --grep "kubernetes"                          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Jun 18 2024  │  │ May 02 2024  │  │ Apr 14 2024  │         │
│  │ docker.svc   │  │ devops.svc   │  │ linux.svc    │         │
│  │ Layer Caching│  │ GitOps with  │  │ cgroups v2   │         │
│  │ #docker #k8s │  │ ArgoCD       │  │ #linux #k8s  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 15.3 Correlation Logic

| Property | Value |
|----------|-------|
| Source | All posts except the current one |
| Score | +2 per shared tag, +1 per shared unit |
| Sort | Descending score, then descending date |
| Count | 3 (or fewer if not enough related) |
| Fallback | If < 3 related, fill with most recent posts in any unit |

### 15.4 Section Styling

| Property | Value |
|----------|-------|
| Container | `glass-bg`, `radius-2xl`, `space-6` padding |
| Header | `$ journalctl --grep "<top-shared-tag>"`, `text-sm`, `font-mono`, `text-tertiary` |
| Layout | Horizontal grid, 3 columns desktop / 1 column mobile, `space-4` gap |
| Margin | `space-12` below content |

### 15.5 Related Entry Card

A compact version of the journal entry:

| Property | Value |
|----------|-------|
| Background | `glass-bg-subtle` |
| Border | `1px solid border-default` |
| Radius | `radius-lg` (12px) |
| Padding | `space-3` |
| Hover | `shadow-glass-hover` + `translateY(-2px)` + `border-accent` |
| Metadata | Date + unit, `text-xs`, `font-mono`, `text-tertiary` / `accent-solid` |
| Title | `text-sm`, `font-semibold`, `text-primary`, 2 lines max |
| Tags | `#tag` pills, `text-2xs`, max 2 + overflow |
| Click | Navigates to that post |

---

## 16. Post Footer (Prev / Next)

### 16.1 Concept

A prev/next navigation between chronological entries — like paging through the journal with `journalctl --cursor`.

### 16.2 Anatomy

```
← Previous entry                              Next entry →
May 02 2024 · devops.service                  Jul 18 2024 · docker.service
GitOps with ArgoCD                            Layer Caching, Explained
```

### 16.3 Styling

| Property | Value |
|----------|-------|
| Layout | Flex, space-between, `space-6` gap |
| Container | `glass-bg-subtle`, `radius-lg`, `space-4` padding |
| Direction | `← Previous` / `Next →`, `font-mono`, `text-xs`, `text-tertiary` |
| Date + unit | `text-xs`, `font-mono`, `text-tertiary` / `accent-solid` |
| Title | `text-sm`, `font-semibold`, `text-primary`, hover `accent-solid` |
| Disabled | If no prev/next (first/last post), the slot is hidden |
| Click | Navigates to the adjacent post |

---

## 17. Post Data Model

Each post (journal entry) has this structure:

| Field | Type | Example | Usage |
|-------|------|---------|-------|
| `slug` | string | `zero-downtime-deployments` | URL path (`/blog/<slug>`) |
| `title` | string | `Zero-Downtime Deployments with Kubernetes` | Entry + post title |
| `unit` | enum | `devops` \| `docker` \| `linux` \| ... | Category → `<unit>.service` |
| `priority` | enum | `info` \| `notice` \| `debug` | Priority dot + label |
| `date` | string | `2024-07-06` | Publish date (ISO) |
| `pid` | number | `1042` | Post ID (shown as `[PID]`) |
| `excerpt` | string | 1–2 sentence summary | Entry excerpt |
| `tags` | string[] | `["docker","k8s","rolling-updates"]` | Tag pills + related correlation |
| `readingTime` | number | `8` | Minutes (computed from body) |
| `body` | string | Markdown source | Rendered post content |
| `headings` | object[] | `[{id,text,level}]` | Auto-derived from body for TOC |
| `draft` | boolean | `false` | If true, excluded from stream + not routed |

---

## 18. Sample Posts

### 18.1 Post: `zero-downtime-deployments` (notice)

| Field | Value |
|-------|-------|
| Slug | `zero-downtime-deployments` |
| Title | Zero-Downtime Deployments with Kubernetes |
| Unit | `devops` (`devops.service`) |
| Priority | `notice` (accent, featured) |
| Date | 2024-07-06 |
| PID | 1042 |
| Excerpt | How rolling updates keep your fleet alive during releases — a field guide to update strategies, health checks, and graceful shutdown. |
| Tags | docker, k8s, rolling-updates |
| Reading time | 8 min |
| Headings | The Problem, Rolling Updates, Health Checks, Surge & Drain, Pitfalls, Conclusion |

### 18.2 Post: `layer-caching-explained` (info)

| Field | Value |
|-------|-------|
| Slug | `layer-caching-explained` |
| Title | Layer Caching, Explained |
| Unit | `docker` (`docker.service`) |
| Priority | `info` (gray, standard) |
| Date | 2024-06-18 |
| PID | 1039 |
| Excerpt | Why your builds are slow and how to fix them — a deep dive into Docker's layer cache, cache keys, and multi-stage builds. |
| Tags | docker, build-cache, multi-stage |
| Reading time | 5 min |
| Headings | The Cache Problem, How Layers Work, Cache Keys, Multi-Stage Builds, Benchmarking, Summary |

### 18.3 Post: `cgroups-v2-deep-dive` (debug)

| Field | Value |
|-------|-------|
| Slug | `cgroups-v2-deep-dive` |
| Title | cgroups v2: A Deep Dive |
| Unit | `linux` (`linux.service`) |
| Priority | `debug` (blue, technical) |
| Date | 2024-04-14 |
| PID | 1031 |
| Excerpt | From process grouping to unified hierarchy — understanding the kernel subsystem that powers every container runtime. |
| Tags | linux, cgroups, kernel, containers |
| Reading time | 12 min |
| Headings | History, v1 vs v2, Unified Hierarchy, Controllers, Practical Examples, Migration, Conclusion |

### 18.4 Post: `on-call-lessons` (info)

| Field | Value |
|-------|-------|
| Slug | `on-call-lessons` |
| Title | On-Call Lessons: A Year of Pages |
| Unit | `support` (`support.service`) |
| Priority | `info` (gray, standard) |
| Date | 2024-03-22 |
| PID | 1024 |
| Excerpt | What 200 pages taught me about alerting, runbooks, and the human cost of 3am incidents. |
| Tags | on-call, sre, postmortems, alerting |
| Reading time | 6 min |
| Headings | The First Page, Alert Fatigue, Runbooks That Work, The Human Factor, What I'd Change |

---

## 19. Animation Choreography

### 19.1 Entrance (Scroll-Triggered)

The stream entries animate in as the stream scrolls into view:

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | Stream container | Fade in | 0ms | 300ms |
| 2 | Stream header | Fade in | 0ms | 200ms |
| 3 | Entries | Fade up + stagger | +60ms each | 320ms each |
| 4 | Journal stats | Fade up (parallel with header) | 0ms | 300ms |

### 19.2 Easing
- Entries: `ease-enter` (`cubic-bezier(0, 0, 0.2, 1)`)
- Stagger: 60ms between entries
- Post page header: `ease-smooth` (`cubic-bezier(0.45, 0, 0.15, 1)`)

### 19.3 Post Page Entrance

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | Back link | Fade in | 0ms | 200ms |
| 2 | Post header | Fade up | 50ms | 400ms |
| 3 | TOC | Fade in + slide from left | 150ms | 300ms |
| 4 | Content | Fade up | 200ms | 400ms |
| 5 | Related entries | Fade up on scroll enter | — | 300ms |

### 19.4 Filter / Search Transition

| Phase | Animation | Duration |
|-------|-----------|----------|
| Removed entries | Fade out + collapse height | 200ms |
| Remaining entries | Re-flow (layout shift) | 200ms |
| New matches | Fade in + expand | 200ms |

### 19.5 TOC Scrollspy

| Phase | Animation | Duration |
|-------|-----------|----------|
| Active item change | Color + accent bar transition | 120ms |
| Easing | `ease-standard` | — |

### 19.6 Reading Progress

| Property | Value |
|----------|-------|
| Update | Width tracks scroll position (throttled via rAF) |
| Transition | `width 100ms linear` (smooth, not janky) |
| Reduced motion | No transition (instant width) |

### 19.7 Reduced Motion
- All entries appear immediately (no scroll-triggered animation).
- Post page content appears instantly (no stagger).
- TOC active state still updates (no smooth scroll; instant jump on click).
- Reading progress bar updates without transition.
- Filter transitions are instant (no fade/collapse).

---

## 20. Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Stream width | Full container (1152px) | Full-width (minus padding) |
| Entry padding | `space-4` | `space-4` |
| Entry metadata row | Inline (all fields) | Wrap (date+unit / priority+reading time) |
| Tags | 4 + overflow | 2 + overflow |
| Filter bar | Inline (units + search + tags) | Stacked (units above, search, tags below) |
| Unit chips | Horizontal scroll if > 8 | Horizontal scroll (always) |
| Tag cloud | Wrap, comfortable | Wrap, tighter |
| Post layout | Two-column (TOC + content) | Single-column (TOC disclosure + content) |
| TOC | Sticky sidebar | Collapsible disclosure at top |
| Content width | `prose` (~72ch) | Full-width (minus padding) |
| Code blocks | Full width, horizontal scroll | Full width, horizontal scroll |
| Related entries | 3-column grid | 1-column stack |
| Prev/next | Side-by-side | Stacked |

### 20.1 Mobile Entry Layout

On mobile, the entry metadata row wraps:

```
┌────────────────────────────────────────────┐
│ Jul 06 2024   devops.service[1042]         │
│ ● notice                        8 min read │
│                                            │
│ Zero-Downtime Deployments with Kubernetes  │
│ How rolling updates keep your fleet...     │
│                                            │
│ #docker  #k8s  #rolling-updates            │
└────────────────────────────────────────────┘
```

### 20.2 Mobile Post Layout

On mobile, the TOC collapses into a disclosure and content takes full width:

```
┌────────────────────────────────────────────┐
│ ▼ On this page                            │
├────────────────────────────────────────────┤
│ [Post header]                             │
│                                            │
│ ## The Problem                             │
│ Rolling updates replace pods...            │
│                                            │
│ ## Rolling Updates                         │
│ ...                                        │
└────────────────────────────────────────────┘
```

---

## 21. Accessibility

| Concern | Solution |
|---------|----------|
| **Semantic structure** | `<article>` per entry, `<h2>` per title, `<nav>` for TOC, `<time>` for dates |
| **Entry semantics** | Each entry is a `<article>` with `aria-labelledby` pointing to its title; the whole card is a link (`<a>`) |
| **Tags** | `aria-label="tag: docker"` on each tag pill; tags are real links |
| **Unit chips** | `aria-pressed` on unit chips; search has `<label>` |
| **TOC** | `<nav aria-label="Table of contents">`; active item has `aria-current="true"` |
| **Code blocks** | `<pre><code>` with `language-*` class; copy button has `aria-label` |
| **Reading progress** | `role="progressbar"` with `aria-valuenow` / `aria-valuemax="100"` |
| **Keyboard** | Entries focusable (as links); TOC items focusable; tags/units focusable |
| **Focus** | Visible 2px accent ring on all interactive elements |
| **Color independence** | Priority has text label + dot, not color alone; tags have `#` prefix |
| **Motion** | Full reduced-motion fallback (instant, static) |
| **Contrast** | All text ≥ 4.5:1 against glass background |

### 21.1 Dual-Content Strategy

Like the other pages, the blog renders **two versions** of metadata where the visual `journalctl` styling is decorative:
1. **Visual:** The `journalctl`-style metadata row (for sighted users).
2. **Semantic:** A visually-hidden (`sr-only`) structured version — `<time>`, `<span>` for unit/category, `<span>` for reading time — for screen readers + SEO.

Both contain identical information; only the presentation differs.

---

## 22. SEO

### 22.1 Blog Index

| Element | Value |
|---------|-------|
| Title | `Journal — Kandarp Khandwala` |
| Description | `Engineering journal by Kandarp Khandwala — DevOps, Docker, Linux, networking, AWS, Python, career, and research posts.` |
| OG title | `Engineering Journal by Kandarp Khandwala` |
| OG description | `A systemd journal of engineering writing — every post an entry, every category a unit.` |
| Structured data | `Blog` + `ItemList` of `BlogPosting` |

### 22.2 Blog Post

| Element | Value |
|---------|-------|
| Title | `<Post Title> — Kandarp Khandwala` |
| Description | Post excerpt |
| OG title | `<Post Title>` |
| OG description | Post excerpt |
| OG type | `article` |
| Article tags | Post tags |
| Published time | Post date (`article:published_time`) |
| Structured data | `BlogPosting` with `headline`, `datePublished`, `author`, `articleSection` (unit), `keywords` (tags), `wordCount`, `timeRequired` (reading time in ISO 8601 duration) |

### 22.3 Sitemap

- `/blog` — index
- `/blog/<slug>` — each post
- `/blog/tags` — tag index
- `/blog/tags/<tag>` — filtered tag view (optional)

---

## 23. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Page header | `PageHeader`, `Eyebrow` |
| Journal stats | `Stat`, `GlassPanel` |
| Filter bar | `ToggleGroup` / `PillNav`, `InputSearch`, `TagCloud` |
| Stream container | `GlassPanel` + custom stream header |
| Journal entry | `GlassPanel` + custom entry + `StatusDot`, `Badge`, `Tag` |
| Priority dot | `StatusDot` |
| Tags | `Tag` (mono pill variant) |
| Unit chips | `PillNav` / `ToggleGroup` |
| Load more | `Button` (ghost) + custom cursor text |
| Post header | `GlassPanel` + `StatusDot`, `Tag`, `BackLink` |
| TOC | `TableOfContents` + `ScrollSpy` |
| Markdown content | `MarkdownRenderer` + `CodeBlock`, `CopyButton`, `Blockquote` |
| Code block | `CodeBlock` + `CopyButton` |
| Reading progress | `ReadingProgress` |
| Related entries | `GlassPanel` + custom related card |
| Prev/next | `Pager` / custom prev-next |
| Entrance animation | `Reveal`, `FadeUp`, `Stagger` |
| Section wrapper | `Section`, `Container` |
| Empty state | `EmptyState` |
| Semantic fallback | Visually hidden `<section>` with `Eyebrow`, headings, lists |

---

## 24. Design Rules Summary

1. **Blog = systemd journal.** Each post is a journal entry with timestamp, unit, priority, and message.
2. **`journalctl` stream.** The index is a reverse-chronological log stream of glass entries.
3. **Categories = units.** DevOps, Docker, Linux, Networking, AWS, Python, Career, Life, Research, Support — each a `<name>.service`.
4. **Tags = log tags.** `#tag` pills, cross-cutting, the primary axis for related-post correlation.
5. **Search = `grep`.** A `journalctl --grep`-style live search across title, excerpt, tags, and unit.
6. **Priority = post level.** `info` (standard), `notice` (featured), `debug` (deep dive) — subtle, filterable.
7. **Reading time = metadata.** Computed from word count, shown in mono on every entry and post.
8. **Post = full entry.** Clicking an entry opens the complete Markdown-rendered message body.
9. **TOC = entry structure.** Auto-generated from headings, sticky on desktop, collapsible on mobile.
10. **Related = correlated entries.** `journalctl --grep` for shared tags — keeps the reader in the journal.
11. **Markdown is the source.** Posts are `.md` files, rendered with terminal-native code blocks and glass blockquotes.
12. **Reduced motion = static log.** Fully readable, zero animation — the journal still scrolls and filters.

---

_The Blog page doesn't publish articles — it logs entries. Every post is a journal entry, every category a unit, and every search a grep through the persistent record of a career in motion._
