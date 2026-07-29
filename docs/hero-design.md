# Hero Section — Design

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Apple · Linear · Stripe
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The Hero is the **first impression** — a single, breathtaking viewport that establishes identity, capability, and tone in under 8 seconds. It pairs a **large typographic name** with a **modern glass terminal** that types out a live command, an **animated role switcher** that cycles through professional identities, a **transparent PNG portrait** that floats with parallax, and **three glass buttons** (Projects, Resume, Contact).

All of this sits over the **animated DevOps constellation** (see [`devops-background.md`](./devops-background.md)) — the hero *is* the foreground of that living background.

**One-line vision:** *A developer's command center — alive, precise, and unmistakably personal.*

---

## 1. Layout

### 1.1 Desktop Layout (lg+)

Two-column asymmetric split (7/5), content-left, portrait-right:

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────────────────┐    ┌──────────────────────┐    │
│   │                            │    │                      │    │
│   │   Eyebrow overline         │    │                      │    │
│   │   KANDARP KHANDWALA        │    │   [Transparent PNG   │    │
│   │   (large name)             │    │    Portrait — floats │    │
│   │                            │    │    with parallax]    │    │
│   │   ┌─ Glass Terminal ─────┐ │    │                      │    │
│   │   │ $ whoami            │ │    │                      │    │
│   │   │ > Full-Stack Engineer│ │    │                      │    │
│   │   │ _ (blinking cursor) │ │    │                      │    │
│   │   └─────────────────────┘ │    │                      │    │
│   │                            │    │                      │    │
│   │   [Projects] [Resume] [Contact] │                      │    │
│   │                            │    │                      │    │
│   └────────────────────────────┘    └──────────────────────┘    │
│                                                                  │
│   [scroll indicator — animated chevron]                          │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Mobile Layout (< md)

Single column, stacked, centered:

```
┌──────────────────────────────┐
│  [Navbar — glass, sticky]    │
├──────────────────────────────┤
│                              │
│   Eyebrow overline           │
│   KANDARP                    │
│   KHANDWALA                  │
│   (stacked, large)           │
│                              │
│   ┌─ Glass Terminal ──────┐  │
│   │ $ whoami              │  │
│   │ > Full-Stack Engineer │  │
│   │ _                     │  │
│   └───────────────────────┘  │
│                              │
│   [Transparent Portrait]     │
│   (smaller, centered)        │
│                              │
│   [Projects]                 │
│   [Resume]                   │
│   [Contact]                  │
│   (stacked, full-width)      │
│                              │
│   [scroll indicator]         │
└──────────────────────────────┘
```

### 1.3 Layout Rules
- **Desktop:** 7/5 split — content gets more space (Linear-style asymmetry).
- **Mobile:** Single column, portrait below terminal (or hidden if too tall).
- **Vertical centering:** Content is vertically centered in the viewport (minus navbar).
- **Min-height:** `100vh` minus navbar height — full viewport experience.
- **Padding:** `space-24` vertical on desktop, `space-12` on mobile.

---

## 2. The Large Name

### 2.1 Typography

| Property | Desktop | Mobile |
|----------|---------|--------|
| Font | Inter Extrabold (800) | Inter Extrabold (800) |
| Size | `display-2xl` (72px) | `display-xl` (44px) |
| Line height | 1.05 | 1.05 |
| Letter spacing | -0.04em | -0.035em |
| Color | `text-primary` (`#1D1D1F`) | same |
| Text wrap | `balance` | `balance` |

### 2.2 Treatment Options

| Option | Spec | When |
|--------|------|------|
| **Solid** | `text-primary` | Default — clean, Apple-like |
| **Gradient accent** | One word in `accent-gradient` (indigo→violet→pink) | Emphasis — "KANDARP" gradient, "KHANDWALA" solid |
| **Outline** | `-webkit-text-stroke: 1px text-primary; color: transparent` | Rare, dramatic |

**Chosen:** Gradient on first name, solid on last name — the signature accent appears once, precisely.

### 2.3 Name Display
- **Desktop:** `KANDARP KHANDWALA` on one line (or two if needed).
- **Mobile:** Stacked — `KANDARP` / `KHANDWALA` — for impact.
- **Animation:** Reveals word-by-word on mount (see §7 Animation).

### 2.4 Eyebrow Overline

Above the name, a small uppercase label:

| Property | Value |
|----------|-------|
| Text | `// PORTFOLIO_OS v1.0` or `FULL-STACK ENGINEER` |
| Font | Inter Semibold (600) |
| Size | `text-2xs` (11px) |
| Tracking | 0.15em |
| Transform | uppercase |
| Color | `text-tertiary` (`#6E6E73`) |
| Mono option | `font-mono` for the `//` prefix |

---

## 3. The Modern Terminal

### 3.1 Purpose
A **glass terminal widget** that types out a live `whoami` command — establishing the "OS" identity and showcasing the role. It's the signature interactive element of the hero.

### 3.2 Terminal Anatomy

```
┌─ Glass Terminal ──────────────────────────────────────┐
│  ● ● ●    ~/kandarp — zsh                    [⋯]     │  ← TerminalHeader
├───────────────────────────────────────────────────────┤
│  $ whoami                                  [typing…]  │  ← TerminalPrompt
│  > Full-Stack Engineer & DevOps Architect             │  ← TerminalOutput
│  $ _                                                   │  ← TerminalCursor (blink)
└───────────────────────────────────────────────────────┘
```

### 3.3 Terminal Styling (Glass)

| Property | Value |
|----------|-------|
| Background | `glass-bg-strong` (`rgba(255,255,255,0.80)`) |
| Backdrop blur | `24px` (strong) |
| Saturation | `180%` |
| Border | `1px solid border-default` + glass edge inset |
| Border radius | `radius-xl` (16px) |
| Shadow | `shadow-glass` |
| Width | 100% of column (max 480px) |
| Padding (header) | `space-2 space-3` |
| Padding (body) | `space-4` |

### 3.4 Terminal Header

| Element | Spec |
|---------|------|
| Traffic lights | 3 dots: `#FF5F57` (red), `#FEBC2E` (yellow), `#28C840` (green) |
| Dot size | 12px diameter, `radius-full` |
| Title | `~/kandarp — zsh`, `font-mono`, `text-xs`, `text-tertiary` |
| Right action | `⋯` menu icon (decorative, non-functional in hero) |
| Divider | `border-subtle` below header |

### 3.5 Terminal Body

| Element | Spec |
|---------|------|
| Font | JetBrains Mono (`font-mono`) |
| Size | `text-sm` (14px) |
| Line height | 1.6 |
| Color (prompt) | `text-tertiary` for `$`, `text-primary` for command |
| Color (output) | `accent-solid` (`#6366F1`) for `>`, `text-secondary` for value |
| Cursor | Block cursor `█`, `text-primary`, blinks every 530ms |

### 3.6 Terminal Content Sequence

The terminal runs a **scripted typing sequence** on loop:

```
$ whoami
> Full-Stack Engineer & DevOps Architect
$ cat skills.json
> { "cloud": ["AWS", "Docker", "K8s"], "code": ["TS", "Go", "Python"] }
$ ./connect.sh
> Connection ready. Let's build something.
$ _
```

| Step | Duration | Action |
|------|----------|--------|
| 1 | 1.2s | Type `whoami` (char-by-char, 60ms/char) |
| 2 | 0.3s | Pause |
| 3 | 0.8s | Output `> Full-Stack Engineer...` (instant or fast-type) |
| 4 | 1.5s | Pause (read time) |
| 5 | 1.2s | Type next command |
| 6 | ... | Continue sequence |
| 7 | 3s | After last line, clear and restart from step 1 |

### 3.7 Terminal Rules
- **Typing is character-by-character** with realistic timing (60–80ms/char).
- **Cursor blinks continuously** — even when not typing.
- **Output appears instantly** (or fast-typed at 20ms/char) — commands type slow, output appears fast.
- **Loop is seamless** — clear screen, restart, no visible "jump."
- **Reduced motion:** Skip typing animation; show full content immediately; cursor static.
- **Mobile:** Terminal is full-width, slightly smaller font (`text-xs`).

---

## 4. The Animated Role Switcher

### 4.1 Purpose
Below the terminal (or integrated into it), a **cycling role label** that rotates through Kandarp's professional identities — communicating range without cluttering the hero.

### 4.2 Two Implementation Concepts

**Concept A — Terminal-Integrated (Recommended):**
The role switcher IS the terminal output. The `whoami` command returns a cycling role:

```
$ whoami
> Full-Stack Engineer          ← (cycles to next role after 2.5s)
> DevOps Architect             ← (fade out, fade in)
> Cloud Engineer
> Open Source Contributor
```

**Concept B — Standalone Badge:**
A separate glass pill below the name that cycles roles:

```
┌─────────────────────────────────────┐
│  ●  Full-Stack Engineer        →    │  ← glass pill, role cycles
└─────────────────────────────────────┘
```

**Chosen:** Concept A (terminal-integrated) — it's more cohesive with the OS theme and avoids redundant elements.

### 4.3 Role List

| # | Role | Color |
|---|------|-------|
| 1 | Full-Stack Engineer | `accent-solid` |
| 2 | DevOps Architect | `accent-solid` |
| 3 | Cloud Engineer | `accent-solid` |
| 4 | Open Source Contributor | `accent-solid` |
| 5 | Systems Thinker | `accent-solid` |

### 4.4 Animation

| Phase | Duration | Easing | Effect |
|-------|----------|--------|--------|
| Display | 2500ms | — | Role visible, cursor blinks |
| Exit | 300ms | `ease-exit` | Fade out + slide up 8px |
| Enter | 400ms | `ease-enter` | Fade in + slide up from 8px below |
| Loop | — | — | Next role |

### 4.5 Role Switcher Rules
- **One role at a time** — never a list.
- **Consistent color** — all roles use `accent-solid`; no per-role coloring.
- **Cursor continues blinking** during transition — terminal feels alive.
- **Reduced motion:** Static first role, no cycling.
- **Pause on hover** (desktop) — lets the reader linger on a role.

---

## 5. The Transparent PNG Portrait

### 5.1 Purpose
A **personal touch** — a transparent-background portrait of Kandarp that floats with parallax, adding humanity to the technical hero.

### 5.2 Image Specification

| Property | Value |
|----------|-------|
| Format | PNG (transparent background) or WebP with alpha |
| Resolution | 800×1000px (source), served responsive |
| Background | Fully transparent (alpha channel) |
| Subject | Kandarp, professional but approachable |
| Style | Clean, well-lit, no busy background |
| Size on screen | 320×400px (desktop), 200×250px (mobile) |

### 5.3 Placement

| Viewport | Position | Size |
|----------|----------|------|
| Desktop (lg+) | Right column, vertically centered | 320×400px |
| Tablet (md) | Right column, slightly smaller | 260×325px |
| Mobile (< md) | Below terminal, centered | 200×250px |

### 5.4 Treatment

The portrait is **not a flat photo**. It's enhanced to match the glass aesthetic:

| Effect | Spec | Purpose |
|--------|------|---------|
| Glass frame | Subtle glass border (`border-glass`) around portrait | Cohesion with system |
| Glow | Soft accent glow behind portrait (`glow-accent-md`) | Depth, separation from background |
| Drop shadow | `shadow-glass` | Floats above constellation |
| Mask | Optional radial mask fade at bottom (dissolve into page) | Seamless blend |
| Reflection | Optional subtle reflection below (10% opacity, flipped) | Premium polish |

### 5.5 Parallax Motion

| Trigger | Effect | Smoothing |
|---------|--------|-----------|
| Mouse move | Portrait shifts ±8px (opposite to mouse — depth illusion) | `damp 0.1` |
| Scroll | Portrait drifts up at 0.7× scroll speed (parallax) | native |
| Idle | Gentle float (±4px sine, 6s) | sine |

### 5.6 Portrait Rules
- **Transparent background is mandatory** — no rectangular photo.
- **Subject is well-lit** — dark portraits clash with light theme.
- **Parallax is subtle** — ±8px max, never disorienting.
- **Reduced motion:** Static portrait, no parallax, no float.
- **Mobile:** Smaller, centered, no parallax (touch).
- **Loading:** Skeleton placeholder (glass rectangle) until image loads.

---

## 6. The Buttons

### 6.1 Button Set

Three buttons, in priority order:

| # | Button | Variant | Icon | Action |
|---|--------|---------|------|--------|
| 1 | **Projects** | Primary (gradient) | `→` arrow | Scroll to /projects |
| 2 | **Resume** | Glass (secondary) | `↓` download | Download PDF / open resume |
| 3 | **Contact** | Ghost (tertiary) | `✉` mail | Scroll to /contact |

### 6.2 Layout

**Desktop:** Horizontal row, left-aligned, `space-3` gap:
```
[ → Projects ]  [ ↓ Resume ]  [ ✉ Contact ]
```

**Mobile:** Stacked vertically, full-width, `space-2` gap:
```
[ → Projects          ]
[ ↓ Resume            ]
[ ✉ Contact           ]
```

### 6.3 Button Styling (per UI System)

| Button | Background | Text | Border | Shadow |
|--------|-----------|------|--------|--------|
| Projects | `accent-gradient` | `text-inverse` | none | `glow-accent-sm` |
| Resume | `glass-bg` + blur | `text-primary` | `border-default` + glass edge | `shadow-glass` |
| Contact | transparent | `text-primary` | none | none |

### 6.4 Button States

| State | Projects | Resume | Contact |
|-------|----------|--------|---------|
| Hover | brightness(1.08) + glow up | glass-bg-strong + lift | overlay-hover |
| Active | scale(0.98) | scale(0.98) | scale(0.98) |
| Focus | 2px accent ring | 2px accent ring | 2px accent ring |

### 6.5 Button Rules
- **One primary (Projects)** — hierarchy is sacred.
- **Icon + label** — left icon, label, optional right arrow on primary.
- **Touch targets ≥ 44px** on mobile (full-width buttons).
- **Resume opens in new tab** (or downloads PDF) — `target="_blank"`.
- **Projects + Contact scroll** to sections (smooth scroll, not route change on home).
- **Loading state:** Resume button shows spinner while PDF fetches.

---

## 7. Animation Choreography

### 7.1 Mount Sequence (Entrance)

The hero animates in on page load, in a **staggered reveal**:

| Order | Element | Animation | Delay | Duration |
|-------|---------|-----------|-------|----------|
| 1 | DevOps background | Fade in | 0ms | 800ms |
| 2 | Eyebrow overline | Fade up | 200ms | 400ms |
| 3 | Name (first word) | Fade up + gradient sweep | 300ms | 500ms |
| 4 | Name (second word) | Fade up | 400ms | 500ms |
| 5 | Terminal | Scale in + fade | 600ms | 500ms |
| 6 | Terminal typing starts | — | 1100ms | — |
| 7 | Portrait | Fade in + slide from right | 700ms | 600ms |
| 8 | Buttons | Stagger fade up (each +80ms) | 900ms | 400ms |
| 9 | Scroll indicator | Fade in | 1400ms | 400ms |

### 7.2 Easing
- All entrance animations use `ease-enter` (`cubic-bezier(0, 0, 0.2, 1)`).
- Terminal scale-in uses `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for a tactile pop.

### 7.3 Continuous Animations (After Mount)

| Element | Animation | Loop |
|---------|-----------|------|
| Terminal cursor | Blink (opacity 1→0→1) | 530ms |
| Terminal typing | Character-by-character | per script |
| Role switcher | Cycle roles | 2500ms each |
| Portrait | Float (sine ±4px) | 6s |
| DevOps background | Galactic rotation | continuous |
| Scroll indicator | Bounce (translateY 0→4→0) | 1.5s |

### 7.4 Scroll Exit

As the user scrolls down past the hero:

| Element | Trigger | Animation |
|---------|---------|-----------|
| Name | 10% scroll | Fade out + parallax up (0.8×) |
| Terminal | 15% scroll | Fade out + parallax up (0.6×) |
| Portrait | 5% scroll | Parallax up (0.7×) + fade at 30% |
| Buttons | 20% scroll | Fade out |
| Background | 30% scroll | Far shell icons fade; rotation speeds up |
| Scroll indicator | 5% scroll | Fade out immediately |

### 7.5 Reduced Motion
- **Entrance:** All elements appear immediately (no stagger, no fade).
- **Terminal:** Full content shown, no typing; cursor static (no blink).
- **Role switcher:** Static first role.
- **Portrait:** Static, no parallax, no float.
- **Background:** Frozen constellation (per DevOps background design).
- **Scroll indicator:** Static.

---

## 8. Scroll Indicator

### 8.1 Anatomy
A subtle animated cue at the bottom center of the hero:

```
         ↓
    Scroll to explore
```

### 8.2 Styling

| Property | Value |
|----------|-------|
| Icon | Chevron-down (Lucide), 20px |
| Label | `text-2xs`, `text-tertiary`, `tracking-wide` |
| Animation | Bounce: translateY 0 → 4px → 0, 1.5s loop, `ease-smooth` |
| Opacity | 60% (subtle) |
| Position | Absolute bottom center, `space-8` from bottom |

### 8.3 Rules
- **Click scrolls** to next section (smooth).
- **Fades out** on scroll (5% scroll progress).
- **Reduced motion:** Static, no bounce.

---

## 9. Responsive Behavior

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Name size | 44px | 56px | 72px |
| Name layout | Stacked (2 lines) | One line | One line |
| Terminal width | Full-width | 420px | 480px |
| Terminal font | `text-xs` | `text-sm` | `text-sm` |
| Portrait | 200×250, centered, below terminal | 260×325, right | 320×400, right |
| Portrait parallax | Disabled | Enabled | Enabled |
| Buttons | Stacked, full-width | Row | Row |
| Background | Static image fallback | Reduced 3D | Full 3D |
| Eyebrow | Hidden (save space) | Shown | Shown |

---

## 10. Accessibility

| Concern | Solution |
|---------|----------|
| **Name is text** | Real `<h1>`, not image — screen readers read it |
| **Terminal is decorative** | `aria-hidden="true"` on terminal visual; role info in a visually-hidden `<span>` |
| **Role switcher** | `aria-live="polite"` so screen readers announce role changes |
| **Portrait** | `alt="Portrait of Kandarp Khandwala"` — descriptive, not decorative |
| **Buttons** | Real `<button>`/`<a>` elements; clear labels; focus visible |
| **Color contrast** | Name 15.8:1, eyebrow 6.4:1, button labels ≥ 4.5:1 |
| **Keyboard** | All buttons reachable via Tab; Enter/Space activates |
| **Motion** | Full reduced-motion fallback (see §7.5) |
| **Skip link** | First focusable element skips past hero to content |

---

## 11. Performance

### 11.1 LCP Target
- **LCP element:** The name (`<h1>`) — renders first, no image dependency.
- **Target:** < 1.2s on 4G.

### 11.2 Loading Strategy

| Asset | Strategy |
|-------|----------|
| Name (text) | Immediate — no loading needed |
| Terminal | Renders immediately; typing starts after mount |
| Portrait | `next/image` with `priority`, blur placeholder |
| Buttons | Render immediately; no assets |
| Background 3D | Lazy after LCP (Suspense + dynamic import) |
| Fonts | `next/font` preloaded — zero layout shift |

### 11.3 Budget

| Asset | Budget |
|-------|--------|
| Hero JS (excl. 3D) | < 30 KB gzip |
| Portrait image | < 150 KB (AVIF/WebP) |
| 3D background | Lazy-loaded, separate chunk |
| Fonts | < 100 KB (subset) |

---

## 12. Component Mapping

Each hero element maps to components in the inventory:

| Element | Component(s) |
|---------|-------------|
| Name | `GradientText`, `Eyebrow`, `AnimatedText` |
| Terminal | `Terminal`, `TerminalHeader`, `TerminalBody`, `TerminalPrompt`, `TerminalCursor`, `TypewriterLine` |
| Role switcher | `TerminalOutput` (cycling) + `AnimatedText` |
| Portrait | `next/image` + `GlassPanel` (frame) + `Parallax` (motion) |
| Buttons | `Button` (×3) + `ButtonGroup` |
| Scroll indicator | `ScrollProgress` or custom chevron |
| Background | `Canvas3D` + DevOps constellation (per [`devops-background.md`](./devops-background.md)) |
| Entrance animation | `Stagger` + `StaggerItem` + `FadeUp` |
| Section wrapper | `Section` + `Container` + `Grid` |

---

## 13. Design Rules Summary

1. **Name is the hero.** Largest element, gradient accent on one word, real text (not image).
2. **Terminal is the signature.** Glass, typing, blinking cursor — the "OS" identity.
3. **Role switcher is terminal-integrated.** One element, two functions.
4. **Portrait is transparent.** No rectangular photo; floats with parallax.
5. **Three buttons, one primary.** Projects (gradient) > Resume (glass) > Contact (ghost).
6. **Staggered entrance.** Name → terminal → portrait → buttons, 80–200ms apart.
7. **Continuous life.** Cursor blinks, roles cycle, portrait floats, background orbits.
8. **Scroll exits gracefully.** Everything parallaxes and fades — no harsh cuts.
9. **Reduced motion is complete.** Static, readable, still beautiful.
10. **Mobile is first-class.** Stacked, centered, no parallax, static background.

---

_The Hero is the handshake. It must be confident, warm, and unmistakably Kandarp's — a command center, not a brochure._
