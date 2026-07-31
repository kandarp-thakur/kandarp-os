# Performance Audit Report — Kandarp OS

**Audit stage:** Pre-change baseline
**Date:** 2026-07-31
**Scope:** Public portfolio runtime, build output, React/Next.js architecture, WebGL, animation, scrolling, terminal effects, images, fonts, and data access.

## Executive summary

The project already contains several strong performance safeguards: server-rendered App Router content, cached public data reads, lazy client-only WebGL, visibility-based render-loop pausing, responsive AVIF/WebP image variants, passive listeners in several paths, and memoized About terminal blocks.

The principal remaining risks are the amount of client-side interactive code in the homepage shell, two independent WebGL canvases mounted from the public layout, persistent decorative background work, per-character React state updates in terminal animations, a boot overlay with a per-frame React update loop, large image/filter effects in the hero, redundant CMS-derived reads, and scroll listeners that still perform work on every event. These are targeted optimization opportunities rather than evidence that any feature must be removed.

Browser-only measurements were not available in this audit environment. No Lighthouse, Chrome Performance panel, React Profiler, or real-device FPS/Core Web Vitals values are claimed below.

## Baseline evidence

### Production build

- [`npx next build`](../package.json:8) completed successfully.
- The package build wrapper initially failed before compilation because Prisma attempted to rename a locked Windows query-engine DLL (`EPERM`). Running the Next production build directly succeeded; this is an environment/file-lock issue, not a TypeScript or Next compilation failure.
- Next.js version: 15.5.22.
- The homepage route `/` reports **12.6 kB route code** and **215 kB First Load JS**.
- Shared browser JavaScript is **102 kB**:
  - `chunks/1255-b7d947a3f77990ce.js`: 46 kB
  - `chunks/4bd1b696-100b9d70ed4e49c1.js`: 54.2 kB
  - other shared chunks: 2.26 kB
- Representative public route First Load JS:
  - `/blog`: 175 kB
  - `/contact`: 132 kB
  - `/experience`: 161 kB
  - `/infrastructure`: 161 kB
  - `/projects`: 160 kB
  - `/skills`: 154 kB
  - `/about`: 129 kB
- The build completed type validation, linting, static generation of 95 pages, and build trace collection.

### Existing positive controls

- [`next.config.mjs`](../next.config.mjs:1) enables standalone output, production compression, production console removal except errors, disabled browser source maps, and package import optimization for Lucide and GSAP.
- [`HeroPortrait3D.tsx`](../src/features/hero/components/HeroPortrait3D.tsx:48) and [`CloudInfinityBackground.tsx`](../src/features/background/components/CloudInfinityBackground.tsx:28) lazy-load the R3F canvas and scenes with `React.lazy` behind [`ClientOnly`](../src/features/shared/components/ClientOnly.tsx:1), avoiding a root App Router SSR bailout.
- Both WebGL hosts pause their R3F loop with `frameloop="never"` when their visibility/tab/focus gates are closed.
- [`Canvas3D.tsx`](../src/infrastructure/three/Canvas3D.tsx:129) disables antialiasing, caps DPR by tier, and disables shadows on low tiers.
- [`useBackgroundTier.ts`](../src/features/background/components/useBackgroundTier.ts:84) downgrades for reduced motion, coarse pointers, low memory, low core count, and constrained network hints.
- [`DevOpsBackground.tsx`](../src/features/background/components/DevOpsBackground.tsx:59) memoizes deterministic constellation generation and applies tier density before rendering.
- [`public-data.ts`](../src/backend/services/public-data.ts:255) uses `unstable_cache` for most public collections and settings/profile reads.
- [`image-optimization.ts`](../src/backend/services/image-optimization.ts:53) generates thumbnail/medium/large variants plus WebP, AVIF, and blur placeholders.
- [`fonts.ts`](../src/assets/fonts.ts:1) intentionally uses system stacks, avoiding build-time external font fetches and font network blocking.
- [`AboutTerminal.tsx`](../src/features/about/components/AboutTerminal.tsx:217) memoizes committed blocks so already-rendered output does not rerender for each typed character.
- [`useTimerQueue.ts`](../src/packages/hooks/useTimerQueue.ts:26) centralizes timer cancellation and has unmount cleanup.

## Findings and priorities

### P0 — reduce concurrent WebGL pressure

The public layout mounts both [`PageBackground`](../src/features/background/components/PageBackground.tsx:45) and [`CloudInfinityBackground`](../src/features/background/components/CloudInfinityBackground.tsx:89). The former is a persistent CSS constellation; the latter mounts a separate R3F canvas for the hero infinity scene. [`HeroPortrait3D`](../src/features/hero/components/HeroPortrait3D.tsx:63) can mount a third R3F canvas when used by the hero configuration.

The visibility gates prevent hidden loops from rendering, but they do not by themselves prevent simultaneous visible canvases. The audit should preserve the visual layers while avoiding unnecessary active loops, duplicate capability probes, and high DPR/shadow cost on constrained devices.

**Priority:** P0 for low-end/mobile GPU and frame consistency.

### P0 — stop avoidable React work during animation

[`BootScreen.tsx`](../src/features/hero/components/BootScreen.tsx:129) calls `setProgress` and `setStageIndex` on every animation frame for up to two seconds. This is unnecessary React scheduling for a decorative progress bar. The visual behavior can remain while progress is driven by a DOM/CSS variable or a lower-frequency update, with completion timers still cleaned up.

[`useHeroTerminal.ts`](../src/packages/hooks/useHeroTerminal.ts:91) and [`useAboutTerminal.ts`](../src/packages/hooks/useAboutTerminal.ts:145) intentionally update typing state per character. This is functionally correct but can create frequent reconciliation and layout/scroll work. The existing About memoization reduces the cost, but batched text reveal or a bounded update cadence should be evaluated without changing the terminal experience.

**Priority:** P0 for main-thread responsiveness and INP.

### P1 — hero paint and compositor cost

[`HeroPortrait.tsx`](../src/features/hero/components/HeroPortrait.tsx:157) applies two large `drop-shadow` filters and multiple Framer Motion transform layers. The portrait is also marked priority and is therefore a likely LCP asset. The appearance should be preserved, but filter area, animation scheduling, and image dimensions should be verified against actual viewport sizes.

[`HeroPortrait3D.tsx`](../src/features/hero/components/HeroPortrait3D.tsx:200) uses a large blurred fallback glow. [`CloudInfinityBackground.tsx`](../src/features/background/components/CloudInfinityBackground.tsx:278) uses two viewport-scale 72px blur glows. These effects are decorative and may increase paint/compositing cost, especially on mobile.

**Priority:** P1 for LCP, GPU memory, and mobile rendering.

### P1 — scroll event work

[`CloudInfinityBackground.tsx`](../src/features/background/components/CloudInfinityBackground.tsx:105) uses a passive listener but reads `getBoundingClientRect()` on every scroll event. [`Navbar.tsx`](../src/features/navigation/components/Navbar.tsx:307) updates React state from every scroll event even when the boolean value has not changed. The active-section observer is already the right architecture; remaining scroll work should be coalesced with `requestAnimationFrame` or guarded against duplicate state writes.

The custom [`scrollToSection()`](../src/packages/utils/navigation.ts:57) animation runs a 700ms `requestAnimationFrame` loop. It is isolated and cancellable, but should be checked for interaction with Lenis and scroll-spy observer churn.

**Priority:** P1 for smooth scrolling and INP.

### P1 — homepage data work is cached but duplicated

[`page.tsx`](../src/app/page.tsx:134) requests several collections and derived statistics in parallel. Several derived functions in [`public-data.ts`](../src/backend/services/public-data.ts:983) call the same cached collection reads again. `unstable_cache` avoids repeated database work after a warm cache, but the request still creates duplicate promises and repeated local reductions. Blog stats are explicitly recomputed in the page after separate blog metadata/tags/units/word-count calls.

The public data layer also uses page sizes of 1000 for collection reads. This is safe for current content but is a payload-growth risk. The audit should retain data completeness while reducing duplicate derivation and returning only fields needed by each route where repository support permits.

**Priority:** P1 for TTFB/server CPU and response size.

### P2 — boot overlay and hydration perception

[`BootScreen.tsx`](../src/features/hero/components/BootScreen.tsx:8) has a 2-second sequence, 200ms delay, and 500ms fade, with a 3.5-second safety lifetime. The page HTML is streamed beneath it, so this does not necessarily delay browser LCP, but it can delay perceived readiness and first interaction. The overlay must remain a feature; its work and duration can be reduced conservatively, and reduced-motion/session behavior should remain intact.

[`HeroSection.tsx`](../src/features/hero/components/HeroSection.tsx:70) uses a hydration gate to avoid a known MotionValue mismatch. This is an intentional correctness safeguard and should not be removed without profiling and hydration validation.

**Priority:** P2 for perceived performance and startup scheduling.

### P2 — WebGL quality configuration

[`presets.ts`](../src/infrastructure/three/presets.ts:186) allows DPR 2 and 2048 shadow maps on high tier. [`LightingRig.tsx`](../src/infrastructure/three/LightingRig.tsx:1), scene components, avatar materials, particles, and cloud geometry still require draw-call/triangle/material inspection. The current architecture has tiering, but high-tier defaults may be aggressive for large/retina viewports. A runtime performance downgrade path exists through [`PerformanceMonitor.tsx`](../src/infrastructure/three/PerformanceMonitor.tsx:1) and should be verified against host callbacks.

**Priority:** P2, with mobile-specific validation.

### P2 — timer cleanup bug

[`CopyButton.tsx`](../src/features/shared/components/CopyButton.tsx:28) returns a cleanup function from an event callback. React does not execute that returned function, so repeated clicks can leave old timers active. This is a small isolated lifecycle issue and should be corrected with a ref-based timeout cleanup or a dedicated effect cleanup.

**Priority:** P2 for lifecycle correctness, low direct frame impact.

### P3 — bundle analysis tooling

The project has no configured bundle analyzer script. The production build provides route and shared First Load JS totals, but not module attribution. Adding an analyzer as a development-only script would make Three.js, postprocessing, Framer Motion, and icon imports measurable without affecting production output.

**Priority:** P3 for ongoing regression prevention.

## Phase coverage

| Area | Current status | Audit conclusion |
|---|---|---|
| React rerenders/state | Partial safeguards | Terminal, boot, navbar, and hero motion need targeted profiling/changes. |
| Next.js splitting/streaming | Good baseline | Server page and lazy client-only WebGL are correctly structured. |
| Three.js | Tiered and paused off-screen | Multiple canvases and high-tier DPR/shadow settings remain the main risk. |
| Framer Motion | Used broadly | Simple decorative transitions and hero layers should be measured before replacing. |
| Scroll | Passive/observer patterns exist | Coalesce rect reads and guard navbar state updates. |
| Hero | Server content + priority image | Large filters, boot overlay, and multiple animation layers need optimization. |
| Terminals | Lifecycle-managed, memoized About blocks | Per-character updates remain the largest local React workload. |
| Images | Strong variant pipeline | Verify actual usage, intrinsic dimensions, and LCP request selection. |
| Fonts | Zero-network system stacks | Keep unless local font assets are introduced; do not add remote font fetches. |
| CSS effects | Extensive glass/blur/shadow vocabulary | Audit persistent blur/filter areas and avoid broad redesign. |
| Database/API | Cached public reads | Remove duplicate derived reads and constrain payloads where safe. |
| Cleanup | Most major loops/listeners clean up | Fix CopyButton timer and inspect debounce/listener paths. |
| Mobile | Tier heuristics exist | Validate DPR, particles, blur, and WebGL concurrency on coarse pointers. |
| Validation | Build successful | Browser metrics and real-device FPS remain unmeasured. |

## Recommended implementation order

1. Add a safe baseline bundle-analysis command and record module attribution.
2. Fix timer cleanup and navbar duplicate state updates.
3. Coalesce background scroll reads and verify Lenis/custom-scroll interaction.
4. Reduce boot per-frame React updates while preserving the overlay.
5. Bound terminal update frequency and preserve reduced-motion/hover behavior.
6. Tune WebGL DPR/shadow/effect defaults by tier and ensure only visible canvases render.
7. Reduce avoidable hero filter/compositing cost without changing layout or appearance.
8. Consolidate duplicated public-data derivations and reduce oversized payloads.
9. Run lint, typecheck, production build, bundle analysis, and browser-based metrics where available.

## Metrics not available in this audit

The following must be measured in Chrome DevTools/Lighthouse/React Profiler before numeric claims are made:

- FCP, LCP, INP, CLS, TTFB.
- Main-thread long tasks and scripting/painting breakdown.
- WebGL draw calls, triangles, texture memory, and active canvas count.
- Actual 60/120 FPS behavior on desktop and mobile.
- React commit count and render duration for hero/terminal interactions.
- Lighthouse Performance score.

This report is the pre-change audit required before implementation. No performance-specific source changes were made while generating it.
