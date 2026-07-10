# Navigation Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-07
> **Aesthetic:** Glassmorphism · Light · Minimal · Apple · Linear · Stripe · Warp
> **Scope:** Design only. No code.

---

## 0. Concept Summary

A **glass navbar** that floats at the top of the viewport — translucent, blurred, and weightless. It sticks on scroll, shrinks subtly when active, and reveals a full-screen mobile menu on small screens. The navbar represents the **complete engineering ecosystem**: a `∞ root@kandarp` terminal-prompt logo, seven flat top-level links (`Projects`, `Experience`, `Infrastructure`, `Toolkit`, `Achievements`, `Logs`, `SSH`), one command-palette trigger, and one theme toggle. Nothing more.

**One-line vision:** *A navigation that is clean, professional, and intuitive for every visitor — recruiters, clients, and engineers alike — while the DevOps theme lives in the section design, not the labels.*

### 0.1 Navigation Mapping

The navbar is a flat list of universally understood labels. The DevOps theme is expressed through each section's design and interactions (container rows, `docker inspect` panels, topology maps) — not through the navigation labels. "Running Containers" is the internal heading of the Projects section, never a navigation label.

| Entry | Type | Target |
|-------|------|--------|
| **Projects** | Direct link | Running Containers (project fleet, `docker ps`) |
| **Experience** | Direct link | Deployment History |
| **Infrastructure** | Direct link | Cloud topology & nodes |
| **Toolkit** | Direct link | Service mesh of skills |
| **Achievements** | Direct link | Unlocked badges & milestones |
| **Logs** | Direct link | Engineering Logs (Blog) |
| **SSH** | Direct link | Interactive Contact Terminal |

Generic, confusing, or theme-leaking labels (`Deploy`, `Running Containers`, `Work`, `Services`) are deliberately avoided in the navbar. The nav order need not match the document order (Projects leads the nav but follows Experience on the page); scroll-spy resolves active state by actual element position.

---

## 1. Navbar Anatomy

### 1.1 Desktop Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ∞ root@kandarp   Projects Experience Infra Toolkit Awards Logs SSH  [⌘K] [☀] │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
    ← glass background, blurred, 1px border, floating with margin ↓
```

### 1.2 Structure

| Region | Content | Alignment |
|--------|---------|-----------|
| **Left** | Logo (mark + wordmark) | Left-aligned |
| **Center** | Nav links | Center-aligned (or left, next to logo) |
| **Right** | Theme toggle + (future: command palette trigger) | Right-aligned |

### 1.3 Container
- The navbar is **not full-bleed**. It floats inside a container with horizontal margin.
- Desktop: `space-6` (24px) margin from viewport edges, `radius-2xl` (20px) corners.
- This creates the "floating pill" aesthetic (Apple/Linear style).

---

## 2. Glass Styling

### 2.1 Navbar Surface

| Property | Top (scrolled) | Top (at rest) |
|----------|---------------|----------------|
| Background | `glass-bg-strong` (`rgba(255,255,255,0.80)`) | `glass-bg` (`rgba(255,255,255,0.65)`) |
| Backdrop blur | `24px` | `16px` |
| Saturation | `180%` | `180%` |
| Border | `1px solid border-default` + glass edge | `1px solid border-subtle` |
| Border radius | `radius-2xl` (20px) | `radius-2xl` (20px) |
| Shadow | `shadow-glass` | `shadow-xs` |
| Padding (Y) | `space-2` (8px) — shrunk | `space-3` (12px) — rest |
| Padding (X) | `space-5` (20px) | `space-5` (20px) |
| Margin (from top) | `space-3` (12px) | `space-3` (12px) |
| Margin (from sides) | `space-4` (16px) | `space-4` (16px) |

### 2.2 Glass Edge Treatment

The navbar uses the signature dual-edge glass border:

```css
border: 1px solid rgba(0, 0, 0, 0.10);
box-shadow:
  inset 0 1px 0 0 rgba(255, 255, 255, 0.50),    /* top light edge */
  inset 0 -1px 0 0 rgba(0, 0, 0, 0.04),         /* bottom shadow edge */
  0 4px 16px rgba(0, 0, 0, 0.06);               /* drop shadow */
```

### 2.3 Rules
- **Always glass** — never opaque. The content behind blurs through.
- **Stronger when scrolled** — more opaque + more blur to ensure link legibility over scrolling content.
- **Floating** — never touches viewport edges; always has margin (the "pill" look).
- **Border always present** — defines the glass edge even at rest.

---

## 3. Sticky Behavior

### 3.1 Position Strategy

| State | Trigger | Behavior |
|-------|---------|----------|
| **At rest** | Scroll position = 0 (top of page) | Full height, subtle glass, minimal shadow |
| **Scrolled** | Scroll position > 80px | Shrinks (padding reduces), stronger glass, shadow appears |
| **Hidden** | Scrolling down fast (optional) | Slides up out of view (future enhancement) |
| **Revealed** | Scrolling up | Slides back down |

### 3.2 Shrink Animation

| Property | At Rest | Scrolled |
|----------|---------|----------|
| Height | 64px | 52px |
| Padding Y | `space-3` (12px) | `space-2` (8px) |
| Logo size | 28px | 24px |
| Link font | `text-sm` (14px) | `text-sm` (14px) — unchanged |
| Transition | — | `250ms ease-smooth` |

### 3.3 Rules
- **Sticky via `position: sticky; top: 12px`** — floats 12px from viewport top.
- **Shrink is smooth** — `ease-smooth` (`cubic-bezier(0.45, 0, 0.15, 1)`), 250ms.
- **Never disappears on home** — the hero needs the navbar context.
- **Scroll-up reveal** (if hidden) is instant — no delay.
- **Reduced motion:** No shrink animation; state changes instantly.

---

## 4. Logo

### 4.1 Anatomy

```
┌────────────────────────┐
│  ∞  root@kandarp        │
└────────────────────────┘
 mark   wordmark (host)
```

The logo reads as a shell prompt: the infinity glyph is the prompt marker,
`root@kandarp` is the `user@host` segment (from `SITE.userAtHost`).

### 4.2 Logo Mark

| Property | Value |
|----------|-------|
| Glyph | `∞` (infinity) |
| Size | `text-2xl` (rest) / `text-xl` (scrolled) |
| Color | `accent-gradient` (indigo→violet→pink) via `bg-clip-text` |
| Treatment | Gradient text fill, no border, `shadow-glow-sm` |
| Font | JetBrains Mono, bold |
| Animation | Subtle rotate on hover (+12°, `ease-smooth`) |

### 4.3 Wordmark

| Property | Value |
|----------|-------|
| Text | `root@kandarp` (`SITE.userAtHost`) |
| Font | JetBrains Mono Medium (500) |
| Size | `text-sm` (14px) |
| Color | `text-primary` |
| Tracking | tight (`tracking-tight`) |

### 4.4 Logo Rules
- **Click navigates home** (`/`).
- **Mark + wordmark together on desktop.**
- **Mark only on mobile** (save space) — wordmark hidden below `md`.
- **Hover:** Mark rotates slightly; no color change.
- **Focus:** Accent ring around the whole logo link.

---

## 5. Navigation Links

### 5.1 Link Set

The navbar is a flat list of seven direct anchor links — no dropdowns.
Labels are plain and universally understood so the navigation is intuitive
for recruiters, clients, and engineers alike. The DevOps theme is expressed
through section design, not navigation labels.

| # | Label | Type | Target | Icon |
|---|-------|------|--------|------|
| 1 | Projects | Direct | `#containers` (Running Containers — project fleet, `docker ps`) | `boxes` |
| 2 | Experience | Direct | `#deployments` (Deployment History) | `git-branch` |
| 3 | Infrastructure | Direct | `#infrastructure` (Cloud topology & nodes) | `network` |
| 4 | Toolkit | Direct | `#toolkit` (Service mesh of skills) | `wrench` |
| 5 | Achievements | Direct | `#achievements` (Unlocked badges & milestones) | `award` |
| 6 | Logs | Direct | `#logs` (Engineering Logs / Blog) | `scroll-text` |
| 7 | SSH | Direct | `#ssh` (Interactive Contact Terminal) | `terminal-square` |

> **Note:** "Running Containers" is the internal heading of the Projects
> section (the `docker ps` project fleet), never a navigation label. The nav
> order need not match the document order — Projects leads the nav but
> follows Experience on the page; scroll-spy resolves active state by actual
> element position.

### 5.2 Link Styling

| Property | Default | Hover | Active (current route) |
|----------|---------|-------|------------------------|
| Color | `text-secondary` | `text-primary` | `accent-solid` |
| Background | transparent | `overlay-hover` | `accent-subtle` |
| Padding | `space-1.5 space-3` | same | same |
| Border radius | `radius-md` (8px) | same | same |
| Font | Inter Medium (500), `text-sm` | same | same |
| Transition | — | `120ms ease-standard` | `120ms ease-standard` |

### 5.3 Active Link Indicator

The current route's link gets a **subtle accent treatment**:

| Indicator | Spec |
|-----------|------|
| Background | `accent-subtle` (`#EEF0FF`) |
| Text color | `accent-solid` (`#6366F1`) |
| Dot indicator | Optional: 4px accent dot below the label |
| Pill shape | `radius-md`, padded |

### 5.4 Link Rules
- **Active state is automatic** — driven by `usePathname()`.
- **Hover is instant** — 120ms, no delay.
- **No underline** — links are pill-style, not text-style.
- **Keyboard accessible** — Tab navigates, Enter activates, focus ring visible.
- **Exact match for Home** — `/` is active only on exact `/`, not on all routes.
- **Infrastructure** is a longer word — ensure it doesn't overflow on medium screens (may truncate to `Infra` below `lg`).

### 5.5 Link Order Rationale
- **Projects** first — the portfolio's primary content; the project fleet is
  what most visitors (recruiters, clients) come to see.
- **Experience → Infrastructure → Toolkit → Achievements** — the supporting
  engineering surfaces, in descending priority.
- **Logs** second-to-last — the engineering journal (blog) is secondary reading.
- **SSH** last — the contact terminal is the conversion action.

---

## 6. Theme Toggle

### 6.1 Placement
- **Right side** of navbar, after the links.
- Separated by a `border-subtle` vertical divider.

### 6.2 Styling

| Property | Value |
|----------|-------|
| Component | `IconButton` (from inventory) |
| Icon | Sun (`sun`) when dark, Moon (`moon`) when light |
| Size | 36px (touch target) |
| Icon size | 18px |
| Background | transparent |
| Hover | `overlay-hover` |
| Border radius | `radius-md` |
| Transition | `200ms ease-standard` (icon crossfade) |

### 6.3 Behavior
- **Click toggles theme** — updates `ThemeProvider`, persists to `localStorage`.
- **Icon crossfades** — sun → moon with a 200ms opacity swap.
- **No flash** — theme is applied before hydration (blocking script in `<head>`).
- **Respects system preference** on first visit (`prefers-color-scheme`).

---

## 7. Responsive Behavior

### 7.1 Breakpoint Behavior

| Breakpoint | Navbar State |
|------------|--------------|
| `xs`–`sm` (< 768px) | **Mobile menu** — hamburger, full-screen overlay |
| `md` (768px+) | **Compact desktop** — logo + links + toggle, tighter spacing |
| `lg`+ (1024px+) | **Full desktop** — logo + links + toggle, comfortable spacing |

### 7.2 Mobile Navbar (< md)

```
┌──────────────────────────────────────┐
│                                      │
│   [◆]                    [☀]  [☰]   │
│                                      │
└──────────────────────────────────────┘
```

| Element | Mobile |
|---------|--------|
| Logo | Mark only (no wordmark) |
| Links | Hidden — in mobile menu |
| Theme toggle | Visible (right) |
| Hamburger | Visible (right, after toggle) |
| Navbar padding | `space-2 space-3` (tighter) |

### 7.3 Hamburger Button

| Property | Value |
|----------|-------|
| Component | `Hamburger` (from inventory) |
| Size | 36px (touch target) |
| Icon | 3 lines → X (animated morph) |
| Animation | Lines rotate + crossfade to X, 250ms `ease-smooth` |
| Color | `text-primary` |

---

## 8. Mobile Menu

### 8.1 Anatomy

A **full-screen overlay** that slides in from the right (or fades in):

```
┌──────────────────────────────────────┐
│                                      │
│   [◆]  Kandarp              [✕]     │
│                                      │
│   ─────────────────────────         │
│                                      │
│        🏠  Home                      │
│        📁  Projects                  │
│        📄  Blog                      │
│        🖥  Infrastructure            │
│        ✉  Contact                    │
│                                      │
│   ─────────────────────────         │
│                                      │
│        [☀]  Toggle theme             │
│                                      │
│   ─────────────────────────         │
│                                      │
│   GitHub  LinkedIn  Twitter  Email   │
│                                      │
└──────────────────────────────────────┘
```

### 8.2 Mobile Menu Styling

| Property | Value |
|----------|-------|
| Background | `glass-bg-strong` (`rgba(255,255,255,0.90)`) |
| Backdrop blur | `24px` |
| Position | Fixed, full viewport |
| Animation | Slide in from right (translateX 100% → 0), 320ms `ease-smooth` |
| Scrim | `scrim` (`rgba(15,15,20,0.40)`) + 8px blur behind menu |

### 8.3 Mobile Menu Links

| Property | Value |
|----------|-------|
| Layout | Vertical stack, centered |
| Gap | `space-2` (8px) |
| Font | Inter Medium (500), `text-lg` (18px) |
| Padding | `space-3 space-4` |
| Icon | Left of label, 20px, `text-tertiary` |
| Active | `accent-solid` text + `accent-subtle` background pill |
| Hover | `overlay-hover` background |
| Border radius | `radius-lg` (12px) |

### 8.4 Mobile Menu Sections

| Section | Content |
|---------|---------|
| **Header** | Logo (mark + wordmark) + close button |
| **Nav links** | 5 links with icons, vertical stack |
| **Theme toggle** | Full-width toggle row |
| **Social links** | Horizontal row of social icons |

### 8.5 Mobile Menu Behavior

| Action | Result |
|--------|--------|
| **Open** (hamburger tap) | Menu slides in; body scroll locked; focus trapped |
| **Close** (X tap) | Menu slides out; body scroll restored; focus returns to hamburger |
| **Link tap** | Navigate + close menu |
| **Escape key** | Close menu |
| **Tap outside** (scrim) | Close menu |
| **Focus trap** | Tab cycles within menu only |

### 8.6 Mobile Menu Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Scrim | Fade in (0 → 1) | 200ms | `ease-enter` |
| Menu panel | Slide from right (100% → 0) | 320ms | `ease-smooth` |
| Links | Stagger fade-in (each +50ms) | 300ms | `ease-enter` |
| Close | Reverse of open | 250ms | `ease-exit` |

### 8.7 Reduced Motion
- Menu appears instantly (no slide).
- Links appear immediately (no stagger).
- Scrim fades only (200ms).

---

## 9. Scroll-Aware Behavior

### 9.1 Scroll Progress Bar

A thin **gradient progress bar** at the very top of the viewport (above the navbar):

| Property | Value |
|----------|-------|
| Height | 2px |
| Background | `accent-gradient` |
| Width | 0% → 100% (tracks scroll progress) |
| Position | Fixed, top: 0, z-index above navbar |
| Shadow | `glow-accent-sm` (subtle glow) |
| Opacity | 80% |

### 9.2 Section Highlight

As the user scrolls through sections, the navbar link corresponding to the **current in-view section** gets the active treatment (via `ScrollSpy`):

| Section in view | Active link |
|-----------------|-------------|
| Experience | Experience |
| Running Containers (Projects) | Projects |
| Infrastructure | Infrastructure |
| Engineering Toolkit | Toolkit |
| Achievements | Achievements |
| Logs | Logs |
| SSH | SSH |

Scroll-spy observes every section id and resolves the active one by **actual
document position** (not nav order), so the correct link highlights even
though the nav order (Projects first) differs from the page order (Experience
precedes Projects).

### 9.3 Rules
- **Scroll progress bar is always visible** (except at very top, where it's 0%).
- **ScrollSpy updates active link** — smooth, debounced (100ms).
- **On route change** (not scroll), active link updates instantly.

---

## 10. Accessibility

| Concern | Solution |
|---------|----------|
| **Semantic nav** | `<nav aria-label="Primary">` wraps the navbar |
| **Skip link** | First focusable element: "Skip to content" (visible on focus) |
| **Keyboard nav** | Tab moves through logo → links → theme toggle → hamburger |
| **Focus visible** | Accent ring (2px) on every focusable element |
| **Active link** | `aria-current="page"` on current route link |
| **Mobile menu** | `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"` |
| **Hamburger** | `aria-expanded`, `aria-controls` pointing to menu, `aria-label="Open menu"` / `"Close menu"` |
| **Theme toggle** | `aria-label="Toggle dark mode"`, `aria-pressed` reflects state |
| **Color contrast** | Links ≥ 4.5:1 (secondary text is 11.2:1), active link accent is 5.9:1 |
| **Touch targets** | All interactive elements ≥ 44×44px on mobile |

---

## 11. States

### 11.1 State Matrix

| State | Navbar Appearance | Trigger |
|-------|-------------------|---------|
| **Top (rest)** | Subtle glass, full height, minimal shadow | Scroll = 0 |
| **Scrolled** | Strong glass, shrunk, shadow | Scroll > 80px |
| **Mobile menu open** | Navbar stays; menu overlay appears | Hamburger tapped |
| **Route change** | Active link updates; no layout shift | `usePathname()` change |
| **Loading** | Navbar renders immediately (static) | Initial page load |
| **Error** | Navbar persists (error boundary below it) | Route error |

### 11.2 Transitions

| Transition | Duration | Easing |
|------------|----------|--------|
| Rest → Scrolled | 250ms | `ease-smooth` |
| Scrolled → Rest | 250ms | `ease-smooth` |
| Link hover | 120ms | `ease-standard` |
| Theme toggle icon | 200ms | `ease-standard` |
| Hamburger → X | 250ms | `ease-smooth` |
| Mobile menu open | 320ms | `ease-smooth` |
| Mobile menu close | 250ms | `ease-exit` |

---

## 12. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Navbar shell | `Navbar`, `StickyHeader` |
| Logo | `Logo`, `LogoMark` |
| Nav links | `NavList`, `NavItem`, `NavLink` |
| Theme toggle | `ThemeToggle`, `IconButton` |
| Hamburger | `Hamburger` |
| Mobile menu | `MobileMenu` |
| Scroll progress | `ScrollProgress` |
| ScrollSpy | `ScrollSpy` |
| Social links (mobile) | `SocialLinks`, `SocialIcon` |
| Container | `Container` |
| Glass surface | `GlassPanel` (or direct glass tokens) |

---

## 13. Design Rules Summary

1. **Floating glass pill.** Never full-bleed; always margin from edges.
2. **Sticky + shrink.** Present at top, shrinks on scroll, never disappears (on home).
3. **Flat links, no dropdowns.** Projects, Experience, Infrastructure, Toolkit, Achievements, Logs, SSH — clean, professional, universally understood labels.
4. **Active link is accent-tinted.** Pill background + accent text + 4px dot indicator.
5. **Logo is `∞ root@kandarp`** — a shell-prompt identity (gradient `∞` mark + mono host wordmark).
6. **Theme toggle always visible.** Right side, separated by divider.
7. **Mobile = full-screen menu.** Slide-in, focus-trapped, scroll-locked; links stack vertically.
8. **Scroll progress bar.** 2px gradient at very top, always tracking.
9. **ScrollSpy highlights current section.** Debounced, smooth; resolves active state by actual document position (order-independent).
10. **DevOps theme lives in the sections, not the labels.** "Running Containers" is the internal Projects heading; the nav label is "Projects".
11. **Accessibility is architecture.** Semantic nav, skip link, focus traps, ARIA.

---

_The navbar is the constant. It must be invisible when unneeded and instant when needed — a glass companion that never leaves._
