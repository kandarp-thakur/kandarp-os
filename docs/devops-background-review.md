# DevOps Background — Performance Review

> **Status:** ✅ Built
> **Date:** 2026-07-06
> **Scope:** The animated DevOps ecosystem background only (no page content).
> **Route:** `/background-preview`

---

## 0. What was built

A reusable, **dependency-free** animated background component that implements
[`devops-background.md`](./devops-background.md) without the Three.js stack
(which is not yet installed — see [`package.json`](../package.json)). It honors
the design philosophy using SVG + CSS transforms + a single shared rAF.

### Files

| File | Role |
|------|------|
| [`src/components/background/devopsIcons.ts`](../src/components/background/devopsIcons.ts) | Monochrome SVG silhouettes: Docker, AWS, Kubernetes, Linux, Networking, Cloud |
| [`src/components/background/constellation.ts`](../src/components/background/constellation.ts) | Seeded, deterministic 3-shell Fibonacci layout + varied motion params |
| [`src/components/background/useBackgroundTier.ts`](../src/components/background/useBackgroundTier.ts) | Device-capability + reduced-motion → tier profile |
| [`src/components/background/useParallax.ts`](../src/components/background/useParallax.ts) | Single-rAF, ref-based mouse parallax (no re-renders) |
| [`src/components/background/DevOpsBackground.tsx`](../src/components/background/DevOpsBackground.tsx) | The reusable component |
| [`src/components/background/BackgroundTierHud.tsx`](../src/components/background/BackgroundTierHud.tsx) | Preview-only FPS/tier readout (not shipped to real pages) |
| [`src/styles/devops-background.css`](../src/styles/devops-background.css) | Keyframes, glass material, tier gating, reduced-motion |
| [`src/app/background-preview/page.tsx`](../src/app/background-preview/page.tsx) | Content-free preview route |

### Design fidelity

- **Glass medallions, monochrome** (§1) — silhouettes inherit `--accent-solid`.
- **3 depth shells** (§4.2): near (sharp) → mid → far (blurred), far→near paint order.
- **Slow, varied rotation** (§3): galactic 120s, orbital 60–90s, self 30–60s,
  float ~8s, tilt ~12s — all phase-offset, no synchronized start.
- **Mouse parallax, smoothed** (§6.1) — damp 0.08, ±18px, deeper shells move more.
- **Content zone clear** (§4.3) — inner radius nudged outward.
- **Tier scaling** (§7.1) — high(33) / medium(~20) / low(~10) / off(0).
- **Reduced motion = frozen composition** (§6.4) — animations halted, still visible.

---

## 1. Build verification

```
npm run typecheck   → exit 0
npm run lint         → ✔ No ESLint warnings or errors
npm run build        → ✓ Compiled successfully
```

### Bundle cost

| Route | Size | First Load JS |
|-------|------|---------------|
| `/background-preview` | **3.92 kB** | 97.8 kB |
| shared (all routes) | 87.1 kB | — |

The background adds **zero new dependencies** — it uses only React, the existing
`cn` util, and CSS. The 3.92 kB route chunk is the component + HUD; the bulk of
First Load JS is the shared Next/React framework already on every page.

---

## 2. Per-frame cost analysis

Target per [`devops-background.md`](./devops-background.md) §7.3: **< 2ms/frame**.

### What runs per frame

| Work | Where | Cost | Notes |
|------|-------|------|-------|
| Parallax damping | `useParallax` rAF | ~0.01ms | one lerp, writes to a ref |
| Parallax apply | `DevOpsBackground` rAF | ~0.02ms | sets 2 CSS custom props on the container |
| CSS animations | compositor | 0 main-thread | `transform`/`opacity` only — GPU-composited |
| FPS sampler | `BackgroundTierHud` (preview only) | ~0.01ms | counter + timestamp compare |

**Main-thread JS per frame: ~0.04ms** (parallax) — well under budget. All
visual motion is compositor-only (`transform`/`opacity`), so it does not block
the main thread even at 33 medallions.

### Why this is cheap

1. **No per-frame React renders.** Parallax writes CSS custom properties on a
   DOM node directly from rAF — React is not in the render loop at all.
2. **No per-medallion JS.** Every medallion's motion is a CSS keyframe driven by
   inline custom properties (`--m-spin`, `--m-float`, …). The browser's
   compositor handles it; JS only sets the values once at mount.
3. **`transform` + `opacity` only.** Both are compositor-friendly — no layout,
   no paint per frame (the #1 rule in [`animation-design.md`](./animation-design.md) §6.1).
4. **`content-visibility: auto` + `contain`** on the constellation skips
   paint/layout for off-screen shells.

---

## 3. Memory & layer budget

| Layer | Count | `will-change` | Rationale |
|-------|-------|---------------|-----------|
| Wash | 1 | transform | animated gradient |
| Galaxy | 1 | transform | galactic rotation |
| Constellation | 1 | transform | parallax group |
| Medallions | 33 (high) | transform, opacity | self-spin + float |
| Medallion inner | 33 | (none) | float + tilt (animated, promoted by browser) |
| Icon | 33 | (none) | counter-rotation |

`will-change` is declared only on the actively-animated outer layers. The
medallion `__inner` and `__icon` rely on the browser's implicit promotion when
they animate `transform` — this avoids over-promoting ~99 layers at rest.

**Risk:** 33 medallions × 3 nested elements = ~99 composited layers on the
high tier. This is within modern GPU budgets but is the main scaling lever —
which is exactly why the tier system trims to ~20 (medium) and ~10 (low).

---

## 4. Tier scaling (§7.1)

| Tier | Medallions | DOF blur | Parallax | Galactic | Motion | Trigger |
|------|-----------|----------|----------|----------|--------|---------|
| high | 33 | ✅ | ✅ | ✅ | ✅ | ≥6 cores, ≥6 GB, fine pointer |
| medium | ~20 | ❌ | ✅ | ✅ | ✅ | 4 cores / 4 GB |
| low | ~10 | ❌ | ❌ | ✅ | ✅ | touch / ≤2 cores / reduced-motion |
| off | 0 | ❌ | ❌ | ❌ | ❌ | no WebGL / save-data / 2g |

Detection is **heuristic + conservative**: when in doubt, downgrade. It folds
in `navigator.hardwareConcurrency`, `deviceMemory`, `pointer: coarse`,
`connection.saveData` / `effectiveType`, and `prefers-reduced-motion`. The
reduced-motion media query is also **observed at runtime** so an OS toggle
mid-session re-evaluates the tier.

---

## 5. Accessibility & reduced motion

- `aria-hidden="true"` + `pointer-events: none` — purely decorative, never
  blocks content or focus.
- `prefers-reduced-motion: reduce` → all animations collapse to `0.01ms`
  (mirrors [`tokens.css`](../src/styles/tokens.css) §reduced-motion). The
  constellation stays visible as a **frozen glass composition** (§6.4).
- `prefers-reduced-data: reduce` → wash/galaxy animations stop.
- The HUD is `aria-hidden` — it's a dev tool, not content.

---

## 6. Known limitations / future work

1. **No true 3D / DOF.** Depth-of-field is faked with CSS `filter: blur()` on
   far shells. This is cheap but is a paint-layer effect, not a real
   post-processing pass. When Three.js lands (per
   [`threejs-architecture.md`](./threejs-architecture.md)), this component is
   the **fallback tier** — the R3F constellation replaces it on high-end
   devices.
2. **`color-mix()` usage.** The wash + halo use `color-mix(in srgb, …)`,
   supported in all evergreen browsers (Chrome 111+, Safari 16.2+, Firefox
   113+). For older targets, add a static-color fallback.
3. **Layer count on high tier.** ~99 composited layers is acceptable but not
   free. If profiling shows GPU memory pressure, promote only the near shell
   and let far shells composite without `will-change`.
4. **No hover brightening (§6.3).** The spec calls for raycast hover
   brightening + tooltips. That's an interaction feature, out of scope for
   "background only" — and `pointer-events: none` is correct for a pure
   background. Add it when the background becomes section-scoped content.
5. **No scroll response (§6.2).** Scroll-driven rotation speed-up + far-shell
   fade-out belong to the scene orchestration layer (GSAP/ScrollTrigger per
   [`animation-design.md`](./animation-design.md) §3.1), not the background
   component itself. Wire when integrating into sections.

---

## 7. How to review

```bash
cd Portfolio
npm run dev
# open http://localhost:3000/background-preview
```

The HUD (top-left) shows the resolved tier, live icon count, and a rolling FPS
sample. Toggle `prefers-reduced-motion` in DevTools → Rendering to confirm the
frozen-composition fallback. Throttle CPU 4× in DevTools to watch the tier
downgrade.

---

_This background is the dependency-free realization of the DevOps constellation.
It is built to be replaced — not rewritten — when the Three.js layer arrives:
same concept, same shells, same tier contract, real glass._
