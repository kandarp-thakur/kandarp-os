# Animation Design — Kandarp OS

> **Status:** 🔄 In Progress (awaiting approval)
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Apple · Linear · Stripe
> **Scope:** Design only. No implementation. This document is the motion contract for the entire portfolio.

---

## 0. Concept Summary

Kandarp OS moves like a **precision instrument**. Motion is never decoration — it is the grammar of cause and effect. Every transition tells the user *what just happened*, *what is possible*, and *where they are going*. The portfolio is an operating system; its animation must feel like a well-tuned OS — responsive, physical, calm, and unmistakably alive.

This document unifies **nine animation categories** (GSAP, Framer Motion, Lenis, Hover, Scroll, Cursor, Glass Reflection, Typing, Transitions) under a **single token vocabulary**, defines the **choreography of every page**, and locks down the **reduced-motion and performance strategy** that keeps the experience fast and accessible on every device.

**One-line vision:** *Motion is physics with intent — every millisecond earns its place, every curve has a reason, every stillness is a choice.*

---

## 1. Relationship to Existing Design System

This document **extends, never overrides**, the motion tokens already defined in [`ui-system.md`](./ui-system.md) §10 and [`design-system.md`](./design-system.md) §8. Those documents are the source of truth for durations, easings, and springs; this document consumes them and adds the orchestration layer.

| Source | Provides | This Document Adds |
|--------|----------|--------------------|
| [`ui-system.md`](./ui-system.md) §10.2 | Duration scale | Per-category duration assignment |
| [`ui-system.md`](./ui-system.md) §10.3 | Easing curves | Per-category easing assignment |
| [`ui-system.md`](./ui-system.md) §10.5 | Spring physics | Per-category spring assignment |
| [`ui-system.md`](./ui-system.md) §10.4 | Motion patterns | Choreography + sequencing |
| [`ui-system.md`](./ui-system.md) §10.6 | Scroll-driven motion | Lenis + scroll-trigger spec |
| [`ui-system.md`](./ui-system.md) §10.7 | Accessibility (motion) | Reduced-motion implementation strategy |
| [`hero-design.md`](./hero-design.md) §7 | Hero choreography | Confirmed + integrated |
| [`navigation-design.md`](./navigation-design.md) §11.2 | Navbar transitions | Confirmed + integrated |
| [`devops-background.md`](./devops-background.md) §3 | 3D scene motion | GSAP/R3F integration spec |

**Rule:** If a value appears in [`ui-system.md`](./ui-system.md), it is canonical. This document only introduces *new* tokens where the existing scale is insufficient (e.g., typing cadence, cursor smoothing) — and every new token is explicitly marked as an extension.

---

## 2. Animation Token Map

### 2.1 Duration Tokens (from [`ui-system.md`](./ui-system.md) §10.2)

| Token | Duration | Character | Primary Use |
|-------|----------|-----------|-------------|
| `duration-instant` | 0ms | None | Reduced-motion fallback, press feedback |
| `duration-fast` | 120ms | Snappy | Hover, focus, color, cursor follow |
| `duration-normal` | 200ms | Standard | Default transitions, illumination, toggle |
| `duration-slow` | 320ms | Deliberate | Layout shifts, reveals, panel slide-in |
| `duration-slower` | 480ms | Page-level | Page transitions, large reveals |
| `duration-cinematic` | 640ms | Dramatic | Hero reveals, 3D scene fades, section entrances |

**Extension tokens** (new — for content/typing cadence, not UI transitions):

| Token | Duration | Character | Use |
|-------|----------|-----------|-----|
| `type-char` | 60ms | Per keystroke | Command typing (hero + about + contact terminals) |
| `type-char-fast` | 20ms | Per keystroke | Output rendering (fast-type) |
| `type-pause` | 300ms | Beat | Pause after a command executes |
| `type-read` | 800ms | Read time | Pause between commands for comprehension |
| `type-loop` | 3000ms | Reset | Pause before terminal loop restarts |
| `cursor-blink` | 530ms | Rhythm | Terminal block-cursor blink cycle |
| `pulse-loop` | 2000ms | Vital | Running-container / active-deployment status pulse |
| `float-loop` | 6000ms | Idle | Portrait float (sine ±4px) |
| `scroll-bounce` | 1500ms | Cue | Scroll-indicator chevron bounce |

### 2.2 Easing Tokens (from [`ui-system.md`](./ui-system.md) §10.3)

| Token | Cubic-Bezier | Character | Primary Use |
|-------|--------------|-----------|-------------|
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Balanced | Default for most transitions |
| `ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerate | Elements appearing (fade-up, scale-in) |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate | Elements leaving (exit faster than enter) |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot | Tactile pop (terminal scale-in, node settle) |
| `ease-smooth` | `cubic-bezier(0.45, 0, 0.15, 1)` | Silk | Apple-style smooth (navbar shrink, panel slide, timeline fill) |

**Rule:** Easing is never `linear` except for: progress bars, spinners, continuous 3D rotation (galactic/orbital/self-spin), and the reading-progress bar width transition (`100ms linear`).

### 2.3 Spring Tokens (Framer Motion — from [`ui-system.md`](./ui-system.md) §10.5)

| Spring | Stiffness | Damping | Mass | Character | Use |
|--------|-----------|---------|------|-----------|-----|
| `spring-snappy` | 500 | 30 | 1 | Crisp | Buttons, toggles, press feedback |
| `spring-smooth` | 300 | 26 | 1 | Fluid | Cards, drag, hover lift |
| `spring-soft` | 200 | 22 | 1 | Gentle | Modals, drawers, large element reveals |
| `spring-bouncy` | 400 | 15 | 1 | Playful | Micro-interactions, node hover, role switch |

**GSAP equivalent** (for 3D scene + scroll-triggered tweens that need spring feel without Framer):

| GSAP Ease | Equivalent | Use |
|-----------|------------|-----|
| `power3.out` | ≈ `ease-enter` | Scene fades, scroll reveals |
| `power2.inOut` | ≈ `ease-smooth` | Timeline fill, panel slide |
| `back.out(1.4)` | ≈ `ease-spring` | Node settle, tactile pop |
| `expo.out` | ≈ `ease-enter` (stronger) | Hero name reveal |
| `none` / `linear` | `linear` | Continuous rotation only |

### 2.4 Stagger Tokens (from [`ui-system.md`](./ui-system.md) §10.4 + page docs)

| Token | Delay | Use |
|-------|-------|-----|
| `stagger-tight` | 50ms | Changelog items, mobile menu links, related entries |
| `stagger-default` | 60ms | Container rows, journal entries, deployment cards |
| `stagger-relaxed` | 80ms | Hero buttons, section content blocks |
| `stagger-ripple` | 40ms | Skills mesh neighbor highlight (subgraph ripple) |
| `stagger-cluster` | 30ms | Skills mesh node entrance (by domain cluster) |

### 2.5 Token-to-Category Assignment Matrix

The master map. Every category draws durations/easings/springs **only** from this table.

| Category | Duration | Easing | Spring | Stagger |
|----------|----------|--------|--------|---------|
| **GSAP** (3D scene) | `cinematic` (fade), continuous (rotation) | `power3.out`, `linear` (rotation) | — (scene physics) | — |
| **Framer Motion** (UI) | `fast`–`slower` | `enter`/`exit`/`smooth`/`spring` | `snappy`/`smooth`/`soft`/`bouncy` | `tight`–`relaxed` |
| **Lenis** (scroll) | continuous (damp) | `linear` (native), `smooth` (anchor) | — | — |
| **Hover** | `fast` (120ms) | `standard` (in), `exit` (out) | `smooth` (cards) | — |
| **Scroll** | `slow`–`cinematic` | `enter` (reveal), `smooth` (fill) | — | `default` |
| **Cursor** | `fast` (follow), `normal` (trail) | `standard` | `smooth` (spring follow) | — |
| **Glass Reflection** | `normal`–`slow` | `smooth` | — | — |
| **Typing** | `type-char`/`type-pause`/`type-read` | `linear` (per-char), `enter` (output fade) | — | — |
| **Transitions** | `slower` (page), `slow` (panel) | `smooth` (enter), `exit` (leave) | `soft` (page), `smooth` (panel) | — |

---

## 3. The Nine Animation Categories

Each category is architected as a **self-contained concern** with a defined responsibility, tool, token set, and integration boundary. Categories compose — they never fight for the same property on the same element.

### 3.1 GSAP — 3D Scene & Scroll-Triggered Sequences

**Responsibility:** Drives the DevOps constellation (R3F/Three.js scene) and any scroll-triggered timeline that needs frame-perfect, scrubbed control beyond what Framer Motion's `useScroll` offers comfortably.

**Tool:** GSAP + ScrollTrigger (to be added as a dependency; see [`package.json`](../package.json) — currently only Framer Motion is installed).

**Scope of control:**
- 3D scene: galactic rotation, orbital paths, self-rotation, float, tilt (per [`devops-background.md`](./devops-background.md) §3). These run on the R3F render loop, **not** GSAP — GSAP only orchestrates *scene-level* tweens (fade-in/out on section enter/leave, scroll-speed ramp).
- ScrollTrigger: timeline progress fill (Experience page), section-boundary constellation fade, hero scroll-exit parallax orchestration.

**Token usage:**
- Scene fade-in: `duration-cinematic` (640ms), `power3.out`.
- Scene fade-out: `duration-slower` (480ms), `power3.out`.
- Scroll-speed ramp: continuous, `linear` (rotation speed scales 1×→2× with scroll velocity).
- Timeline fill: scrubbed to scroll, visual easing `power2.inOut` (≈ `ease-smooth`).

**Boundary rule:** GSAP **never** animates DOM UI components (buttons, cards, text). Those belong to Framer Motion. GSAP touches only: the `<Canvas>` wrapper opacity, the timeline `<div>` height, and R3F scene uniforms via refs.

**Reduced motion:** All GSAP scroll-triggers resolve to their end state instantly. Scene rotation halts (frozen constellation per [`devops-background.md`](./devops-background.md) §6.4). Timeline fill renders at 100%.

---

### 3.2 Framer Motion — UI Component Motion

**Responsibility:** The workhorse for all DOM-level animation: entrances, exits, hover, layout, drag, gestures, presence, and staggered reveals. This is the **default tool** for any animated UI element.

**Tool:** `framer-motion` v11 (already in [`package.json`](../package.json)).

**Scope of control:**
- Page/section entrance reveals (`FadeUp`, `Reveal`, `Stagger`).
- Interactive: hover lift, press scale, drag, tap.
- Presence: modal/drawer mount/unmount, AnimatePresence for route transitions.
- Layout: `layoutId` for shared-element transitions (active nav indicator, expanding cards).
- Scroll-linked: `useScroll` + `useTransform` for parallax (portrait, hero exit), progress bars.

**Token usage:**
- Entrances: `duration-slow` (320ms) + `ease-enter`, or `duration-cinematic` (640ms) for hero.
- Exits: `duration-fast` (120ms)–`duration-normal` (200ms) + `ease-exit` (exit faster than enter).
- Hover: `duration-fast` (120ms) + `ease-standard`.
- Springs: `spring-snappy` (buttons), `spring-smooth` (cards), `spring-soft` (modals), `spring-bouncy` (micro-interactions).
- Stagger: `stagger-default` (60ms) unless page doc specifies otherwise.

**Variants pattern** (canonical, reused everywhere):

```ts
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
};
```

**Boundary rule:** Framer Motion **never** touches the 3D canvas internals or the scroll position (Lenis owns that). It reads scroll via `useScroll` but does not write it.

**Reduced motion:** All variants collapse to `duration-instant` with no transform. `useReducedMotion()` hook gates every animated component; when true, components render in their `visible` state immediately.

---

### 3.3 Lenis — Smooth Scroll

**Responsibility:** Owns the scroll position. Provides buttery, momentum-based scrolling that makes every other scroll-linked animation feel cohesive. Without Lenis, scroll-triggered reveals and parallax feel jittery and disconnected.

**Tool:** `lenis` (to be added as a dependency).

**Scope of control:**
- Global smooth scroll on `<html>` (desktop + tablet).
- Anchor-link smooth scroll (TOC, hero buttons, scroll indicator).
- Scroll-velocity signal (fed to GSAP for scene speed ramp).

**Configuration:**

| Option | Value | Rationale |
|--------|-------|-----------|
| `duration` | 1.1s | Apple-like glide, not floaty |
| `easing` | `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))` | Expo-out — decelerate to rest |
| `smoothWheel` | `true` | Mouse wheel smoothing |
| `smoothTouch` | `false` | Native touch scroll (avoid fighting iOS) |
| `wheelMultiplier` | 1.0 | No acceleration |
| `touchMultiplier` | 1.5 | Slightly responsive touch |
| `infinite` | `false` | Bounded scroll |

**Integration:**
- Lenis drives `window.scrollY`; GSAP ScrollTrigger and Framer `useScroll` read from it via `lenis.on('scroll', ScrollTrigger.update)`.
- RAF loop: `lenis.raf(time)` called in a single `requestAnimationFrame` loop, shared with R3F if both active.

**Boundary rule:** Lenis is **disabled on touch devices** (`smoothTouch: false`) — native momentum is better. It is **disabled entirely under reduced motion** (instant scroll, no smoothing).

**Reduced motion:** Lenis is not initialized. `scroll-behavior: auto`. Anchor links jump instantly. All scroll-linked animations resolve to their in-view state.

---

### 3.4 Hover — Micro-Interaction Layer

**Responsibility:** The tactile feedback layer. Every interactive element responds to pointer presence with a precise, fast, reversible transform. Hover is **enhancement, not requirement** — all hover states have focus and active equivalents.

**Tool:** CSS transitions (default) + Framer Motion (for physics-based hover like drag/scale springs).

**Token usage:**
- Duration: `duration-fast` (120ms) — anything slower feels sluggish (per [`ui-system.md`](./ui-system.md) §10.8).
- Easing in: `ease-standard`. Easing out: `ease-exit` (slightly faster exit).
- Cards: `spring-smooth` when using Framer (lift + shadow + border compound).

**Hover vocabulary** (canonical patterns, reused across pages):

| Element | Transform | Duration | Easing | Extra |
|---------|-----------|----------|--------|-------|
| Button (primary) | `brightness(1.08)` + glow up | 120ms | `standard` | glow `glow-accent-md` |
| Button (glass/ghost) | bg → `glass-bg-strong` / `overlay-hover` | 120ms | `standard` | — |
| Card | `translateY(-2px)` + `shadow-glass-hover` + `border-accent` | 120ms | `standard` | compound |
| Link (text) | color → `accent-solid` | 120ms | `standard` | underline grow |
| Nav link | bg → `overlay-hover`, color → `text-primary` | 120ms | `standard` | — |
| Logo mark | rotate ±15° | 300ms | `smooth` | — |
| Status dot (running) | pulse speeds up briefly | 120ms | `standard` | — |
| Skill node | scale 1.08, border → gradient, glow on | 120ms | `standard` | triggers illumination |
| Terminal output row | bg → `overlay-hover` | 120ms | `standard` | — |

**Rules:**
- **One transform at a time** per element unless compound is specified (card lift is the only sanctioned compound: translate + shadow + border).
- **Hover never changes layout** — only transform, opacity, color, shadow, border.
- **Hover is desktop-only.** Touch devices get `:active` press feedback instead (`scale(0.98)`, `duration-instant`).
- **Focus = hover** for a11y: `:focus-visible` mirrors the hover treatment so keyboard users get the same feedback.

**Reduced motion:** Hover still works (it's not motion sickness-inducing), but transforms are instant (`duration-instant`). Color/shadow transitions remain at 120ms (color changes are not motion). Card lift becomes a shadow-only change (no translate).

---

### 3.5 Scroll — Reveal, Parallax, Progress

**Responsibility:** The narrative layer. Scroll choreographs the page's story — elements reveal as they enter, backgrounds parallax, progress bars track, timelines fill. Scroll motion is **once-per-element** for reveals (no re-trigger on scroll-up) unless the page is a continuous experience (timeline fill).

**Tool:** Framer Motion `useScroll` + `useInView` (reveals), GSAP ScrollTrigger (timeline fill, scene fade), Lenis (smoothing).

**Token usage:**
- Reveal entrance: `duration-slow` (320ms) + `ease-enter`.
- Parallax: continuous, tied to scroll progress (no duration — it's scrubbed).
- Progress bar: `width 100ms linear` (per [`blog-page-design.md`](./blog-page-design.md) §19.6).
- Timeline fill: scrubbed, visual `ease-smooth`.

**Reveal patterns:**

| Pattern | From → To | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Fade in | opacity 0→1 | 300ms | `enter` | in-view, once |
| Fade up | opacity 0→1, y 8px→0 | 320ms | `enter` | in-view, once |
| Scale in | opacity 0→1, scale 0.96→1 | 200ms | `spring` | in-view, once |
| Slide in | translateX/Y → 0 | 320ms | `smooth` | in-view, once |
| Stagger | children +60ms | 320ms each | `enter` | parent in-view, once |

**Parallax layers** (desktop only):

| Layer | Speed | Element |
|-------|-------|---------|
| Background (far) | 0.3× | DevOps far shell |
| Background (mid) | 0.5× | DevOps mid shell |
| Portrait | 0.7× | Hero portrait drift |
| Content | 1.0× | Normal scroll |
| Foreground | 1.2× | Scroll indicator, hero name (exit) |

**Scroll progress indicators:**
- **Global:** 2px gradient bar at viewport top (per [`navigation-design.md`](./navigation-design.md) §9.1), `accent-gradient`, `glow-accent-sm`, 80% opacity.
- **Reading (blog post):** 2px gradient bar, `width 100ms linear`, `role="progressbar"`.
- **Timeline (experience):** vertical line fills with `accent-gradient`, scrubbed to scroll, glow on fill edge.

**Rules:**
- **Reveals fire once.** `useInView({ once: true })`. Re-triggering on scroll-up is distracting and wasteful.
- **Parallax is desktop-only.** Disabled on touch (no mouse, limited GPU).
- **Progress bars use `linear`** — they track a scalar, not a motion arc.
- **Scroll-linked transforms must not cause layout shift.** Only `transform` and `opacity`.

**Reduced motion:** All reveals resolve to visible instantly. Parallax disabled (all layers 1.0×). Progress bars still update (they're informational, not motion-sickness-inducing) but without transition. Timeline renders fully filled.

---

### 3.6 Cursor — Custom Pointer & Trail

**Responsibility:** An optional ambient layer that replaces the default cursor with a refined custom pointer on desktop. The cursor is **glass-tinted**, **spring-followed**, and **context-aware** (grows over interactive elements, shows a label over special zones). It is pure enhancement — the site is fully usable without it.

**Tool:** Framer Motion (`useMotionValue` + `useSpring` for follow), CSS for the visual.

**Scope of control:**
- A fixed, pointer-events-none `<div>` that follows the mouse with spring smoothing.
- State variants: `default`, `hover` (over interactive), `text` (over text inputs/terminal), `view` (over project rows / journal entries — signals clickability).

**Token usage:**
- Follow: `spring-smooth` (stiffness 300, damping 26) — trails slightly, never lags.
- State morph: `duration-fast` (120ms) + `ease-standard` (size/color change).
- Trail (optional secondary dot): `spring-soft` (stiffer lag for a comet-tail effect).

**Visual spec:**

| State | Size | Style | Blend |
|-------|------|-------|-------|
| `default` | 8px dot | `accent-solid`, 80% opacity | `mix-blend-mode: difference` |
| `hover` | 36px ring | 1.5px `accent-solid` border, transparent fill | normal |
| `text` | 2px × 16px bar | `text-primary` (I-beam replacement) | normal |
| `view` | 48px ring + `↗` glyph | `accent-gradient` border, glyph `text-tertiary` | normal |

**Rules:**
- **Desktop pointer devices only.** `@media (hover: hover) and (pointer: fine)`.
- **Hidden on touch** — native cursor/touch is correct.
- **Never blocks interaction** — `pointer-events: none` always.
- **Native cursor hidden** only when custom cursor is active (`cursor: none` on `body` in that media query).
- **Context-aware via data attributes:** interactive elements set `data-cursor="hover"`, project rows set `data-cursor="view"`.

**Reduced motion:** Custom cursor is **disabled entirely**. Native cursor restored. (A spring-followed cursor is continuous motion — excluded under reduced-motion per [`ui-system.md`](./ui-system.md) §10.7.)

---

### 3.7 Glass Reflection — Surface Light Response

**Responsibility:** The signature material animation. Glass surfaces in Kandarp OS don't just sit — they **respond to light and pointer**. A moving sheen crosses glass cards on hover; the navbar's inset highlight shifts with scroll direction; the portrait's glass frame catches a virtual light source. This is what makes glass feel *real* rather than printed.

**Tool:** CSS (conic/radial gradient + `background-position` transition) + Framer Motion (pointer-tracked sheen via `useMotionValue`).

**Token usage:**
- Sheen sweep: `duration-slow` (320ms) + `ease-smooth`.
- Pointer-tracked highlight: continuous (spring `smooth`), no discrete duration.
- Scroll-direction edge highlight: `duration-normal` (200ms) + `ease-standard`.

**Patterns:**

| Pattern | Mechanism | Where |
|---------|-----------|-------|
| **Hover sheen** | A diagonal conic-gradient overlay sweeps across the card on `mouseenter` (opacity 0→1→0) | Glass cards, buttons (primary) |
| **Pointer glare** | A radial gradient follows the pointer position inside the card bounds (like a spotlight on glass) | Hero terminal, inspect panel, large feature cards |
| **Scroll edge** | The navbar's top inset-highlight opacity shifts with scroll velocity (scrolling down dims it slightly — simulates light angle change) | Navbar |
| **Portrait light** | A soft radial glow behind the portrait shifts ±4px opposite to mouse (parallax light source) | Hero portrait |

**Hover sheen spec:**
```css
.glass-card::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
  background-size: 250% 250%;
  background-position: 100% 100%;
  opacity: 0;
  transition: opacity 320ms cubic-bezier(0.45,0,0.15,1), background-position 320ms cubic-bezier(0.45,0,0.15,1);
  pointer-events: none;
}
.glass-card:hover::before {
  opacity: 1;
  background-position: 0% 0%;
}
```

**Rules:**
- **Sheen is one-shot per hover** — it sweeps in, doesn't loop.
- **Pointer glare is desktop-only** (needs mouse position).
- **Never on glass inside glass** (per [`ui-system.md`](./ui-system.md) §6.6 — nesting muddies).
- **Subtle always.** The sheen peak is `rgba(255,255,255,0.4)` max — a whisper, not a flash.

**Reduced motion:** Sheen sweep disabled (static subtle highlight). Pointer glare disabled. Scroll-edge and portrait-light disabled. Glass still looks like glass via the static inset border (per [`ui-system.md`](./ui-system.md) §8.4) — the material identity is preserved without motion.

---

### 3.8 Typing — Terminal Cadence

**Responsibility:** The terminal is the OS's voice. Typing animation makes commands feel *executed*, not *displayed*. This category governs the hero terminal, the About page session, the Contact SSH terminal, and any typewriter element. It is the most content-sensitive category — timing must serve readability.

**Tool:** Custom hook (extend existing [`useTerminal.ts`](../src/hooks/useTerminal.ts)) + Framer Motion (for output line entrance).

**Token usage** (extension tokens from §2.1):
- Command typing: `type-char` (60ms/char).
- Output rendering: instant, or `type-char-fast` (20ms/char) for fast-type.
- Post-execute pause: `type-pause` (300ms).
- Read pause: `type-read` (800ms).
- Loop reset: `type-loop` (3000ms).
- Cursor blink: `cursor-blink` (530ms).
- Output line entrance: `duration-fast` (120ms) + `ease-enter` (fade + 4px slide).

**Execution model** (per [`about-page-design.md`](./about-page-design.md) §3.4):

| Phase | Action | Duration |
|-------|--------|----------|
| 1. Type command | char-by-char | 60ms/char |
| 2. Execute | cursor to next line, pause | 300ms |
| 3. Render output | fade-in or fast-type | 200ms |
| 4. Read pause | before next command | 800ms |
| 5. Next | repeat | — |

**Per-terminal behavior:**

| Terminal | Trigger | Loop | Cursor |
|----------|---------|------|--------|
| Hero (`whoami` sequence) | Mount + 1100ms delay | Yes — clear + restart after `type-loop` | Blink always |
| About (7-command session) | Scroll-into-view, sequential | No (runs once) | Blink during typing + pauses |
| Contact (SSH session) | User input driven | No (interactive) | Blink when ready |

**Rules:**
- **Commands type slow; output appears fast.** Asymmetry signals "I typed this, the system responded."
- **Only one command types at a time** — sequential, never parallel.
- **Cursor blinks continuously** — even during pauses, the terminal feels alive.
- **Loop is seamless** — clear screen, restart, no visible jump (hero only).
- **Scroll-triggered execution** (About): each command fires as its block enters viewport, not all at once.
- **Pause on hover** (hero, desktop): lets the reader linger.

**Reduced motion:** All content appears instantly — no typing. Cursor is static (no blink). Terminal is a fully readable static document. The boot sequence in [`useTerminal.ts`](../src/hooks/useTerminal.ts) (currently 180ms/line) collapses to instant.

---

### 3.9 Transitions — Page, Panel, Route

**Responsibility:** The connective tissue between states. Page-to-page route transitions, panel/drawer open-close, modal mount-unmount, and accordion expand-collapse. Transitions maintain **spatial continuity** — the user always knows where they came from and where they're going.

**Tool:** Framer Motion `AnimatePresence` + `layoutId` (Next.js App Router route transitions via a top-level `<AnimatePresence>` wrapper).

**Token usage:**
- Page transition: `duration-slower` (480ms), `ease-smooth` (enter) / `ease-exit` (leave), `spring-soft` for the feel.
- Panel/drawer: `duration-slow` (320ms), `ease-smooth`.
- Modal: `duration-normal` (200ms) scale-in, `ease-spring`.
- Accordion expand: `duration-slow` (320ms), `ease-smooth`; collapse `duration-normal` (200ms), `ease-exit`.
- Scrim: `duration-normal` (200ms) fade, `ease-enter` (in) / `ease-exit` (out).

**Transition vocabulary:**

| Transition | Enter | Exit | Notes |
|------------|-------|------|-------|
| **Route (page)** | fade + slight scale 0.98→1, y 8px→0 | fade + scale 1→0.98, y 0→-8 | Old page exits as new enters (crossfade) |
| **Drawer (right)** | translateX 100%→0 | translateX 0→100% | Desktop inspect panel |
| **Bottom sheet** | translateY 100%→0 | translateY 0→100% | Mobile inspect panel |
| **Modal** | scale 0.96→1 + opacity | scale 1→0.96 + opacity | `ease-spring` on enter |
| **Accordion** | height 0→auto + opacity | height auto→0 + opacity | Content staggers in on expand |
| **Scrim** | opacity 0→1 | opacity 1→0 | Always accompanies overlay |
| **Mobile menu** | translateX 100%→0 (panel) + scrim | reverse, faster | Links stagger `stagger-tight` |

**Route transition pattern:**
- Outgoing page: opacity 1→0, y 0→-8px, `duration-normal` (200ms), `ease-exit`.
- Incoming page: opacity 0→1, y 8px→0, `duration-slower` (480ms), `ease-smooth`.
- The DevOps constellation (when present) **does not re-mount** between pages that share it (Hero→About→Skills) — it persists, only its opacity transitions. This is the "feels like one place" effect.

**Rules:**
- **Exit is faster than enter** (200ms out, 320–480ms in) — leaving is decisive, arriving is considered.
- **One transition metaphor per surface type** — drawers always slide horizontally (desktop) or vertically (mobile), never both.
- **Scrim always accompanies overlays** — never a panel without a dimmed, blurred backdrop.
- **Focus management follows transition** — focus moves to the panel/modal on open, returns to trigger on close.
- **`layoutId` for shared elements** — the active nav indicator slides between links; an expanding card can morph from row to panel.

**Reduced motion:** All transitions are instant (`duration-instant`). Pages swap with a simple opacity crossfade (200ms max — opacity-only is permitted as it's not vestibular). Panels/modals appear immediately in final position. Accordions expand/collapse instantly. Scrims still fade (opacity-only, 200ms).

---

## 4. Per-Page Animation Choreography

Each page has a **choreography score** — the sequence of motion from load through scroll through interaction. These consolidate and extend the animation sections already present in each page-design doc.

### 4.1 Home (Hero)

The signature 8-second first impression. Full choreography in [`hero-design.md`](./hero-design.md) §7; this section confirms and locks the token mapping.

**Mount sequence (entrance):**

| # | Element | Animation | Delay | Duration | Easing | Tool |
|---|---------|-----------|-------|----------|--------|------|
| 1 | DevOps background | Fade in | 0ms | 640ms (`cinematic`) | `power3.out` | GSAP |
| 2 | Eyebrow overline | Fade up | 200ms | 320ms (`slow`) | `ease-enter` | Framer |
| 3 | Name (word 1) | Fade up + gradient sweep | 300ms | 480ms (`slower`) | `ease-enter` | Framer |
| 4 | Name (word 2) | Fade up | 400ms | 480ms (`slower`) | `ease-enter` | Framer |
| 5 | Terminal | Scale in 0.96→1 + fade | 600ms | 480ms (`slower`) | `ease-spring` | Framer |
| 6 | Terminal typing starts | char-by-char | 1100ms | per `type-char` | `linear` | Typing |
| 7 | Portrait | Fade in + slide from right | 700ms | 640ms (`cinematic`) | `ease-enter` | Framer |
| 8 | Buttons | Stagger fade up | 900ms (+80ms each) | 320ms (`slow`) each | `ease-enter` | Framer |
| 9 | Scroll indicator | Fade in | 1400ms | 320ms (`slow`) | `ease-enter` | Framer |

**Continuous (after mount):**

| Element | Animation | Loop | Token |
|---------|-----------|------|-------|
| Terminal cursor | Blink (opacity 1→0→1) | 530ms | `cursor-blink` |
| Terminal typing | char-by-char sequence | per script | `type-char` / `type-read` / `type-loop` |
| Role switcher | Cycle roles (exit 300ms `ease-exit`, enter 400ms `ease-enter`) | 2500ms each | — |
| Portrait | Float (sine ±4px) | 6000ms | `float-loop` |
| DevOps background | Galactic + orbital + self rotation | continuous | `linear` (scene) |
| Scroll indicator | Bounce (translateY 0→4→0) | 1500ms | `scroll-bounce`, `ease-smooth` |

**Scroll exit (parallax + fade):**

| Element | Trigger | Animation | Tool |
|---------|---------|-----------|------|
| Scroll indicator | 5% scroll | Fade out immediately | Framer `useScroll` |
| Portrait | 5% scroll | Parallax up 0.7× + fade at 30% | Framer `useScroll` |
| Name | 10% scroll | Fade out + parallax up 0.8× | Framer `useScroll` |
| Terminal | 15% scroll | Fade out + parallax up 0.6× | Framer `useScroll` |
| Buttons | 20% scroll | Fade out | Framer `useScroll` |
| Background (far shell) | 30% scroll | Fade out; rotation speeds 2× | GSAP ScrollTrigger |

**Cursor:** `view` state over buttons; `text` state over terminal (if interactive). Custom cursor active.

**Glass reflection:** Pointer glare on terminal; portrait light parallax.

---

### 4.2 Projects (Container Fleet)

Full choreography in [`projects-page-design.md`](./projects-page-design.md) §9.

**Entrance (scroll-triggered):**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Page header | Fade up | 0ms | 320ms (`slow`) | `ease-enter` |
| 2 | Fleet stats | Fade up (parallel) | 0ms | 320ms (`slow`) | `ease-enter` |
| 3 | Filter bar | Fade up | 100ms | 320ms (`slow`) | `ease-enter` |
| 4 | Table header | Fade in | 0ms | 200ms (`normal`) | `ease-enter` |
| 5 | Container rows | Fade up + stagger | +60ms each (`stagger-default`) | 320ms (`slow`) each | `ease-enter` |

**Continuous:**
- Running-container status dots: pulse (scale 1→1.3→1, opacity 1→0.6→1), `pulse-loop` (2000ms), `ease-smooth`, infinite.

**Inspect panel open:**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Scrim | Fade in 0→1 | 0ms | 200ms (`normal`) | `ease-enter` |
| 2 | Panel | Slide from right (translateX 100%→0) | 0ms | 320ms (`slow`) | `ease-smooth` |
| 3 | Manifest | Fade in | 100ms | 200ms (`normal`) | `ease-enter` |
| 4 | Sections | Fade up + stagger | +60ms each | 240ms each | `ease-enter` |
| 5 | Metrics | Count up | — | 800ms | `ease-out` |
| 6 | Changelog | Fade in + stagger | +50ms each (`stagger-tight`) | 200ms each | `ease-enter` |

**Inspect panel close:** Panel slide out (translateX 0→100%), 250ms, `ease-exit`; scrim fade out 200ms.

**Filter/search:** Removed rows fade out + collapse height (200ms); new matches fade in + expand (200ms). Search debounced 150ms.

**Cursor:** `view` state over container rows (signals clickability); `hover` over filters/ports.

**Glass reflection:** Hover sheen on container rows; pointer glare on inspect panel.

---

### 4.3 Experience (Deployment History)

Full choreography in [`experience-page-design.md`](./experience-page-design.md) §8.

**Entrance (scroll-triggered, per card):**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Timeline node | Scale in 0→1 + glow | 0ms | 300ms (`slow`) | `ease-spring` |
| 2 | Timeline line fill | Grows to node position | 0ms | 400ms (`slower`) | `ease-smooth` |
| 3 | Card | Fade up + slide from timeline side | 100ms | 480ms (`slower`) | `ease-enter` |
| 4 | Card content | Fade in | 300ms | 300ms (`slow`) | `ease-enter` |

**Continuous:**
- Active-deployment status dot: pulse (scale 1→1.3→1, opacity 1→0.6→1), `pulse-loop` (2000ms), `ease-smooth`, infinite.
- Timeline fill: scrubbed to scroll progress (GSAP ScrollTrigger), `accent-gradient`, glow on fill edge.

**Expand/collapse:**

| Phase | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| Expand | Height auto + content fade-in (stagger `stagger-tight`) | 320ms (`slow`) | `ease-smooth` |
| Collapse | Height 0 + content fade-out | 200ms (`normal`) | `ease-exit` |
| Chevron | Rotate 180° | 200ms (`normal`) | `ease-standard` |

**Cursor:** `hover` over cards (clickable to expand).

**Glass reflection:** Hover sheen on deployment cards.

---

### 4.4 Skills (Service Mesh)

Full choreography in [`skills-page-design.md`](./skills-page-design.md) §10.

**Entrance (scroll-triggered):**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Page header + stats | Fade up | 0ms | 320ms (`slow`) | `ease-enter` |
| 2 | Canvas | Fade in | 0ms | 300ms (`slow`) | `ease-enter` |
| 3 | Edges | Draw in (opacity 0→0.5) | 100ms | 400ms (`slower`) | `ease-standard` |
| 4 | Nodes | Scale in 0.8→1 + fade, staggered by cluster | 200ms (+30ms each, `stagger-cluster`) | 320ms (`slow`) each | `ease-spring` |
| 5 | Legend | Fade in | 600ms | 200ms (`normal`) | `ease-enter` |

**Continuous:**
- Active-node status ring: pulse (opacity 1→0.5→1, scale 1→1.06→1), 2400ms, `ease-smooth`, infinite.
- Learning-node dashed ring: slow rotate (8s `linear`) — optional, disabled on reduced motion.

**Hover illumination (the signature motion):**

| Phase | Element | Animation | Duration | Easing |
|-------|---------|-----------|----------|--------|
| Enter | Hovered node | Scale 1→1.08, border → gradient, glow on | 120ms (`fast`) | `ease-standard` |
| Enter | Neighbors | Scale 1→1.04, brighten, +40ms stagger (`stagger-ripple`) | 120ms each | `ease-standard` |
| Enter | Illuminated edges | Opacity 0.5→1, color → gradient, width 1→1.5px | 200ms (`normal`) | `ease-standard` |
| Enter | Dimmed nodes/edges | Opacity → 0.35 / 0.15 | 200ms (`normal`) | `ease-standard` |
| Enter | Detail panel | Fade up + slide 8px | 200ms (`normal`) | `ease-enter` |
| Exit | All | Return to default (faster) | 120ms (`fast`) | `ease-exit` |

**Cursor:** `hover` over nodes (signals explorability).

**Glass reflection:** Pointer glare on graph canvas (subtle); hover sheen on detail panel.

---

### 4.5 Blog (Systemd Journal)

Full choreography in [`blog-page-design.md`](./blog-page-design.md) §19.

**Index entrance (scroll-triggered):**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Page header + stats | Fade up | 0ms | 300ms (`slow`) | `ease-enter` |
| 2 | Filter bar | Fade up | 100ms | 300ms (`slow`) | `ease-enter` |
| 3 | Stream container | Fade in | 0ms | 300ms (`slow`) | `ease-enter` |
| 4 | Stream header | Fade in | 0ms | 200ms (`normal`) | `ease-enter` |
| 5 | Entries | Fade up + stagger | +60ms each (`stagger-default`) | 320ms (`slow`) each | `ease-enter` |

**Post page entrance:**

| # | Element | Animation | Delay | Duration | Easing |
|---|---------|-----------|-------|----------|--------|
| 1 | Back link | Fade in | 0ms | 200ms (`normal`) | `ease-enter` |
| 2 | Post header | Fade up | 50ms | 400ms (`slower`) | `ease-smooth` |
| 3 | TOC | Fade in + slide from left | 150ms | 300ms (`slow`) | `ease-smooth` |
| 4 | Content | Fade up | 200ms | 400ms (`slower`) | `ease-enter` |
| 5 | Related entries | Fade up on scroll enter | — | 300ms (`slow`) | `ease-enter` |

**Continuous:**
- Reading progress bar: width tracks scroll, `100ms linear`, `accent-gradient`.
- TOC scrollspy: active item color + accent bar, 120ms (`fast`), `ease-standard`.

**Filter/search:** Same as Projects (fade + collapse, 200ms; debounced 150ms).

**Cursor:** `view` over journal entries; `hover` over tags/units.

**Glass reflection:** Hover sheen on entries; pointer glare on post header.

---

### 4.6 About (Terminal Session)

Full choreography in [`about-page-design.md`](./about-page-design.md) §3.

**Entrance:**
- Page header: fade up on scroll enter, 320ms (`slow`), `ease-enter`.

**Terminal session (scroll-triggered, sequential):**
Each command fires as its block scrolls into view (IntersectionObserver). Per [`about-page-design.md`](./about-page-design.md) §3.5:

| Command | Trigger | Typing | Output |
|---------|---------|--------|--------|
| `whoami` | Terminal enters viewport | 60ms/char | instant |
| `neofetch` | After whoami output visible | 60ms/char | instant |
| `hostnamectl` | After neofetch visible | 60ms/char | instant |
| `cat /etc/education.conf` | Mid-terminal | 60ms/char | instant |
| `systemctl status career.service` | Further | 60ms/char | instant |
| `cat /etc/motd` | Further | 60ms/char | instant |
| `cat /etc/goals.list` | Near bottom | 60ms/char | instant |

**Per-command execution model:** Type (60ms/char) → execute pause (300ms) → output fade-in (200ms) → read pause (800ms) → next.

**Continuous:**
- Cursor blink: 530ms (`cursor-blink`), always.

**Cursor:** `text` state over terminal (it's a session, not interactive input on this page — but visually text-like).

**Glass reflection:** Pointer glare on terminal container (subtle, static-ish).

---

### 4.7 Contact (SSH Session)

The interactive terminal. Driven by [`useTerminal.ts`](../src/hooks/useTerminal.ts).

**Entrance:**
- Page header: fade up, 320ms (`slow`), `ease-enter`.
- Terminal: scale-in 0.96→1 + fade, 480ms (`slower`), `ease-spring`, 200ms delay.

**Boot sequence:**
- Currently in [`useTerminal.ts`](../src/hooks/useTerminal.ts): lines print at 180ms intervals after a 200ms boot delay.
- **Token mapping:** boot line interval → `type-pause` (300ms) is too slow for boot; keep 180ms as a boot-specific cadence (between `type-char-fast` and `type-pause`). Boot delay → 200ms (matches terminal mount).
- Cursor blink: 530ms (`cursor-blink`), starts after boot completes (`isReady`).

**Interactive:**
- User types command: native input (no per-char animation — it's real input).
- On submit: echo prompt + command as input line (fade-in 120ms `ease-enter`), then output lines append (each fade-in 120ms `ease-enter`, +40ms stagger `stagger-ripple`).
- `clear`: screen wipes (fade-out 200ms `ease-exit`, then empty).
- External link open: link line appears, then `window.open` fires.

**Cursor:** `text` state over the input field; `hover` over link lines.

**Glass reflection:** Pointer glare on terminal container.

---

## 5. Reduced-Motion Strategy

Reduced motion is **not an afterthought** — it is a first-class mode with equal design care. The goal: a visitor with `prefers-reduced-motion: reduce` gets a **static, beautiful, fully functional** experience. Nothing is broken, nothing is missing, nothing moves unnecessarily.

### 5.1 Detection

- **CSS:** `@media (prefers-reduced-motion: reduce)` in [`tokens.css`](../src/styles/tokens.css) and component CSS.
- **JS:** Framer Motion's `useReducedMotion()` hook in every animated component. A single `MotionProvider` context broadcasts the preference.
- **Persistence:** If the OS setting is unavailable, default to *motion enabled* (the site is designed for motion). Never force motion on a user who requested reduced.

### 5.2 What Gets Disabled

| Category | Reduced-Motion Behavior |
|----------|-------------------------|
| **GSAP** | Scene rotation halts (frozen constellation). ScrollTriggers resolve to end state. Timeline renders fully filled. |
| **Framer Motion** | All variants collapse to `duration-instant`, no transform. Components render in `visible` state immediately. `useReducedMotion()` gates every component. |
| **Lenis** | Not initialized. Native instant scroll. Anchor links jump. |
| **Hover** | Transforms instant (`duration-instant`). Color/shadow transitions remain (not vestibular). Card lift → shadow-only (no translate). |
| **Scroll** | Reveals resolve to visible instantly. Parallax disabled (all layers 1.0×). Progress bars update without transition. Timeline fully filled. |
| **Cursor** | Custom cursor **disabled entirely**. Native cursor restored. |
| **Glass Reflection** | Sheen sweep disabled. Pointer glare disabled. Scroll-edge + portrait-light disabled. Static inset border preserves glass identity. |
| **Typing** | All content appears instantly. No char-by-char typing. Cursor static (no blink). Boot sequence instant. |
| **Transitions** | Instant (`duration-instant`). Pages: opacity crossfade 200ms max (opacity-only permitted). Panels/modals appear in final position. Accordions instant. Scrims fade 200ms. |

### 5.3 What Stays

- **Color and opacity transitions** ≤ 200ms remain (not vestibular, aid comprehension).
- **Status indicators** still convey state (color, text label, icon) — just without pulse/animation.
- **Focus rings** remain (accessibility-critical).
- **Layout** is identical — reduced motion changes timing, not structure.
- **All content** is present and readable.

### 5.4 Implementation Pattern

Every animated component follows this guard:

```tsx
function FadeUp({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true }}
      variants={prefersReducedMotion ? undefined : fadeUp}
    >
      {children}
    </motion.div>
  );
}
```

When `prefersReducedMotion` is true: `initial={false}` (no initial state), `variants={undefined}` (no animation) — the content renders immediately in place.

### 5.5 Global CSS Fallback

A safety net in [`tokens.css`](../src/styles/tokens.css) catches anything the JS guard misses:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Performance Strategy

Motion must never come at the cost of responsiveness. Kandarp OS targets **60fps** on desktop and **stable 30–60fps** on mobile, with graceful degradation.

### 6.1 Performance Budgets

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| Animation JS (Framer Motion) | < 45 KB gzip | Already in [`package.json`](../package.json) |
| GSAP (core + ScrollTrigger) | < 35 KB gzip | Lazy-loaded only where needed |
| Lenis | < 5 KB gzip | Lazy-loaded, desktop only |
| Per-frame JS work | < 4ms (to hit 60fps) | rAF batching, no layout thrash |
| 3D background frame cost | < 2ms | Per [`devops-background.md`](./devops-background.md) §7.3 |
| Animated properties | `transform` + `opacity` only | Never animate `width`/`height`/`top`/`left` (except height in accordion — see §6.4) |

### 6.2 Device Tiering

Motion scales by device capability. A `PerformanceGate` context (per [`devops-background.md`](./devops-background.md) §7.1) determines the tier.

| Tier | 3D | Lenis | Parallax | Custom Cursor | Glass Reflection | Typing |
|------|-----|-------|----------|---------------|------------------|--------|
| **High** (desktop, discrete GPU) | Full 33 icons + DOF + bloom | ✅ | ✅ | ✅ | ✅ pointer glare | ✅ |
| **Medium** (laptop integrated) | 20 icons, no DOF | ✅ | ✅ | ✅ | sheen only | ✅ |
| **Low** (mobile) | 10 icons or static image | ❌ (native) | ❌ | ❌ | sheen only | ✅ |
| **Off** (no WebGL) | CSS gradient + SVG pattern | ❌ | ❌ | ❌ | sheen only | ✅ |
| **Reduced motion** (any tier) | Frozen/static | ❌ | ❌ | ❌ | static border | instant |

### 6.3 GPU Acceleration

- **Always animate `transform` and `opacity`.** These are compositor-friendly (no layout/paint).
- **Promote layers sparingly:** `will-change: transform` only on elements actively animating (remove after). Over-promotion causes memory pressure.
- **Avoid `backdrop-filter` animation** — it's expensive. Glass blur is static; only the sheen overlay animates (a separate composited layer).
- **`contain: layout style paint`** on scroll containers to limit repaint scope.

### 6.4 The Height Animation Exception

Accordions (Experience cards, mobile TOC) animate `height: 0 → auto`. This is a layout property and normally forbidden. Mitigations:
- Use Framer Motion's `height: "auto"` with `layout` — it measures and animates via `transform` where possible.
- Keep accordion animations to `duration-slow` (320ms) max — brief enough that the layout cost is acceptable.
- Alternative: animate `grid-template-rows: 0fr → 1fr` (modern CSS, compositor-friendly) where browser support allows.

### 6.5 Scroll Performance

- **Lenis** runs in a single rAF loop, shared with R3F when both active. Never two rAF loops.
- **Scroll-linked transforms** use `useScroll` + `useTransform` (Framer) — these read `scrollY` passively and output to `MotionValue`s (no React re-render per frame).
- **ScrollTrigger** (GSAP) updates via `lenis.on('scroll', ScrollTrigger.update)` — single source of truth.
- **Throttle** scroll handlers: progress bar via rAF, scrollspy debounced 100ms (per [`navigation-design.md`](./navigation-design.md) §9.3).
- **`passive: true`** on all scroll event listeners.

### 6.6 Loading Strategy

- **Framer Motion** is bundled with the app (already a dependency). Core animation primitives are available immediately.
- **GSAP + ScrollTrigger** are **dynamically imported** only on pages that use them (Experience timeline, Hero scene orchestration). Code-split via `next/dynamic`.
- **Lenis** is dynamically imported in a client-side `useEffect`, desktop-only. Fails gracefully to native scroll.
- **3D scene** is lazy-loaded after LCP (per [`hero-design.md`](./hero-design.md) §11.2) via Suspense + dynamic import.
- **Custom cursor** is a tiny client component, mounted after hydration (no SSR cost).

### 6.7 Monitoring

- **LCP target:** < 1.2s on 4G (per [`hero-design.md`](./hero-design.md) §11.1). The hero name (text) is LCP — no animation dependency.
- **CLS target:** 0. Animations use `transform`/`opacity` (no layout shift). Reveals start at `opacity: 0` but elements occupy final space (no collapse).
- **INP target:** < 200ms. Hover/tap feedback is 120ms max; press feedback instant. No animation blocks input.
- **Frame budget:** DevTools Performance tab in dev; Lighthouse in CI. Any frame > 16ms on desktop is a bug.

---

## 7. Integration Architecture

How the nine categories wire together at runtime.

### 7.1 Provider Stack

```
<ThemeProvider>              // theme (light/dark)
  <PerformanceGateProvider>  // device tier detection
    <MotionProvider>         // reduced-motion broadcast
      <LenisProvider>        // smooth scroll (desktop, non-reduced)
        <App />
      </LenisProvider>
    </MotionProvider>
  </PerformanceGateProvider>
</ThemeProvider>
```

### 7.2 Ownership Boundaries (No Conflicts)

| Property | Owner | Others may read, never write |
|----------|-------|------------------------------|
| `window.scrollY` | Lenis | GSAP ScrollTrigger, Framer `useScroll` |
| `transform` (UI) | Framer Motion | CSS hover (only when Framer not active) |
| `transform` (3D scene) | R3F render loop | GSAP (scene-level uniforms only) |
| `opacity` (DOM) | Framer Motion | GSAP (canvas wrapper only) |
| `opacity` (3D scene) | GSAP | — |
| `width` (progress bars) | Framer `useScroll` / CSS | — |
| `height` (accordions) | Framer `layout` | — |
| Cursor position | Framer `useMotionValue` | — |

**Rule:** No two categories animate the same property of the same element. If a conflict arises, the **lower-numbered category in §3 wins** (GSAP > Framer > Lenis > ...).

### 7.3 The rAF Loop

A single `requestAnimationFrame` loop drives all per-frame work:

```
rAF(time) {
  lenis.raf(time)          // scroll smoothing
  r3f.advance(time)        // 3D render (if active)
  // Framer Motion runs its own internal rAF; no manual call needed
}
```

GSAP ScrollTrigger updates are pushed by `lenis.on('scroll')`, not polled.

---

## 8. Token Implementation

New tokens (the §2.1 extensions) are added to [`tokens.css`](../src/styles/tokens.css) as CSS custom properties and to a shared TS constants file for JS consumption.

### 8.1 CSS (in [`tokens.css`](../src/styles/tokens.css))

```css
:root {
  /* Typing cadence */
  --type-char: 60ms;
  --type-char-fast: 20ms;
  --type-pause: 300ms;
  --type-read: 800ms;
  --type-loop: 3000ms;
  --cursor-blink: 530ms;

  /* Continuous loops */
  --pulse-loop: 2000ms;
  --float-loop: 6000ms;
  --scroll-bounce: 1500ms;

  /* Stagger */
  --stagger-tight: 50ms;
  --stagger-default: 60ms;
  --stagger-relaxed: 80ms;
  --stagger-ripple: 40ms;
  --stagger-cluster: 30ms;
}
```

### 8.2 TypeScript (in [`src/utils/constants.ts`](../src/utils/constants.ts))

```ts
export const MOTION = {
  duration: {
    instant: 0,
    fast: 0.12,
    normal: 0.2,
    slow: 0.32,
    slower: 0.48,
    cinematic: 0.64,
  },
  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
    enter: [0, 0, 0.2, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
    smooth: [0.45, 0, 0.15, 1] as const,
  },
  spring: {
    snappy: { stiffness: 500, damping: 30, mass: 1 },
    smooth: { stiffness: 300, damping: 26, mass: 1 },
    soft: { stiffness: 200, damping: 22, mass: 1 },
    bouncy: { stiffness: 400, damping: 15, mass: 1 },
  },
  stagger: {
    tight: 0.05,
    default: 0.06,
    relaxed: 0.08,
    ripple: 0.04,
    cluster: 0.03,
  },
  typing: {
    char: 60,
    charFast: 20,
    pause: 300,
    read: 800,
    loop: 3000,
    cursorBlink: 530,
  },
} as const;
```

---

## 9. Design Rules Summary

1. **Tokens, not magic numbers.** Every duration, easing, spring, and cadence flows from §2. If it's not there, it doesn't animate.
2. **Nine categories, nine concerns.** Each category owns its domain; none fights another for the same property.
3. **Framer Motion is the default.** GSAP is for 3D scene orchestration and scrubbed timelines only. Lenis owns scroll. CSS owns hover (with Framer for physics).
4. **`transform` and `opacity` only** — except accordions (height, mitigated) and progress bars (width, linear).
5. **Exit is faster than enter.** Leaving is decisive (120–200ms); arriving is considered (320–480ms).
6. **Easing is never linear** — except rotation, progress bars, and spinners.
7. **Hover ≤ 120ms.** Anything slower feels sluggish.
8. **Reveals fire once.** `useInView({ once: true })`. No re-trigger on scroll-up.
9. **Parallax is desktop-only.** Touch gets native scroll, no parallax, no custom cursor.
10. **Reduced motion is complete.** Static, beautiful, fully functional — never broken.
11. **Performance is respect.** 60fps desktop, stable mobile, graceful degradation by tier.
12. **One rAF loop.** Lenis + R3F share it. Framer runs its own. No polling.
13. **Motion communicates cause and effect.** Never decorative-only (per [`ui-system.md`](./ui-system.md) §10.1).
14. **Duration scales with distance.** Small movements fast; large reveals slow.
15. **Never block interaction.** Elements are clickable during animation.

---

## 10. Open Questions for Approval

This document is a **plan awaiting sign-off**. The following decisions are proposed and need confirmation:

1. **GSAP as a new dependency.** [`package.json`](../package.json) currently has only Framer Motion. GSAP + ScrollTrigger (~35 KB gzip) would be added, dynamically imported on Experience + Hero pages only. **Alternative:** implement timeline fill and scene fade with Framer Motion's `useScroll` alone (possible but less ergonomic for scrubbed timelines). *Recommendation: add GSAP.*

2. **Lenis as a new dependency.** ~5 KB gzip, desktop-only, dynamically imported. **Alternative:** rely on native CSS `scroll-behavior: smooth` + Framer `useScroll` (less buttery, but zero deps). *Recommendation: add Lenis — the Apple-grade glide is core to the aesthetic.*

3. **Custom cursor.** Pure enhancement, desktop-only, disabled under reduced motion. Adds a small client component + `mix-blend-mode` layer. **Alternative:** skip it; native cursor is fine. *Recommendation: include it — it's a signature detail, but make it the lowest-priority ship.*

4. **Glass reflection pointer glare.** Requires per-card mouse tracking (Framer `useMotionValue`). Slight per-card cost. **Alternative:** hover sheen only (CSS, no JS tracking). *Recommendation: sheen everywhere, pointer glare only on hero terminal + inspect panel (the hero surfaces).*

5. **Typing cadence tokens.** The §2.1 extension tokens (`type-char`, `type-pause`, etc.) are new. They're content-timing, not UI-timing. **Confirm** they belong in the token system (vs. hardcoded in the terminal hook). *Recommendation: tokenize them — consistency across 3 terminals.*

6. **Route transitions via App Router.** Next.js App Router doesn't natively support `AnimatePresence` on route change without a wrapper. **Confirm** the approach: a top-level `<AnimatePresence mode="wait">` in the root layout keyed by `pathname`. *Recommendation: yes — the crossfade is worth the wrapper.*

7. **Height animation for accordions.** Animating `height: auto` is a known performance concern. **Confirm** the mitigation: Framer `layout` + `grid-template-rows` fallback. *Recommendation: accept the exception; accordions are brief (320ms) and infrequent.*

---

_Last Updated: 2026-07-06_
_Status: 🔄 In Progress (awaiting approval)_

_This document is the motion contract of Kandarp OS. Every animation must be traceable to these tokens and categories. When the motion evolves, this document evolves first._
