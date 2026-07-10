# Optimization Plan — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Targets:** Lighthouse ≥ 95 (all categories) · 60 FPS desktop / 30–60 FPS mobile
> **Scope:** The single, consolidated performance contract. Unifies the scattered budgets in [`architecture.md`](./architecture.md) §9, [`threejs-architecture.md`](./threejs-architecture.md) §10–12, [`animation-design.md`](./animation-design.md) §6, [`devops-background.md`](./devops-background.md) §7, [`hero-design.md`](./hero-design.md) §11, and [`coding-standards.md`](./coding-standards.md) §9 into one implementation-ready plan.

---

## 0. How to Read This Document

Performance is **architecture**, not a final pass. This plan is organized around the seven optimization pillars requested, each mapped to concrete techniques, budgets, file locations, and acceptance checks. The two headline targets — **95 Lighthouse** and **60 FPS** — are the non-negotiable outcomes; every pillar exists to serve them.

| Pillar | Primary Target | Owner Layer |
|--------|----------------|-------------|
| [Lazy Loading](#2-lazy-loading) | LCP / TBT | Next.js App Router |
| [Dynamic Imports](#3-dynamic-imports) | Initial JS budget | Next.js + R3F |
| [Instancing](#4-instancing) | 3D frame budget | Three.js / R3F |
| [LOD](#5-lod-level-of-detail) | 3D frame budget | Three.js / R3F |
| [Tree Shaking](#6-tree-shaking) | Initial JS budget | Bundler / imports |
| [Image Optimization](#7-image-optimization) | LCP / CLS / weight | `next/image` |
| [Three.js Optimization](#8-threejs-optimization) | 60 FPS | R3F systems |

---

## 1. Performance Targets & Budgets

### 1.1 Headline Targets

| Target | Value | Source |
|--------|-------|--------|
| Lighthouse — Performance | ≥ 95 | [`vision.md`](./vision.md) §4.2, [`roadmap.md`](./roadmap.md) §6.5 |
| Lighthouse — Accessibility | ≥ 95 | [`roadmap.md`](./roadmap.md) §6.5 |
| Lighthouse — Best Practices | ≥ 95 | [`roadmap.md`](./roadmap.md) §6.5 |
| Lighthouse — SEO | ≥ 95 | [`roadmap.md`](./roadmap.md) §6.5 |
| FPS — Desktop | 60 (16.6ms/frame) | [`animation-design.md`](./animation-design.md) §6, [`threejs-architecture.md`](./threejs-architecture.md) §11 |
| FPS — Mobile | 30–60 (tier-gated) | [`threejs-architecture.md`](./threejs-architecture.md) §11 |
| LCP | < 1.2s on 4G | [`hero-design.md`](./hero-design.md) §11.1 |
| CLS | 0 | [`animation-design.md`](./animation-design.md) §6.7 |
| INP | < 200ms | [`animation-design.md`](./animation-design.md) §6.7 |
| TTI | < 2.5s mid-range mobile | [`vision.md`](./vision.md) §4.2 |

### 1.2 Asset Budgets (Enforced in CI)

| Asset | Budget | Enforcement | Source |
|-------|--------|-------------|--------|
| Initial JS | < 150 KB gzip | Bundle analyzer + Lighthouse CI | [`architecture.md`](./architecture.md) §9.1, [`coding-standards.md`](./coding-standards.md) §9 |
| Initial CSS | < 30 KB gzip | Tailwind purge | [`architecture.md`](./architecture.md) §9.1 |
| LCP image | < 200 KB | `next/image` AVIF/WebP | [`architecture.md`](./architecture.md) §9.1 |
| Hero JS (excl. 3D) | < 30 KB gzip | Bundle analyzer | [`hero-design.md`](./hero-design.md) §11.3 |
| Portrait image | < 150 KB | `next/image` AVIF/WebP | [`hero-design.md`](./hero-design.md) §11.3 |
| Fonts | < 100 KB | `next/font` + subset | [`architecture.md`](./architecture.md) §9.1 |
| 3D scene total | < 2 MB (lazy) | Suspense + dynamic import | [`architecture.md`](./architecture.md) §9.1 |
| Framer Motion | < 45 KB gzip | Already bundled | [`animation-design.md`](./animation-design.md) §6.1 |
| GSAP (core + ScrollTrigger) | < 35 KB gzip | Lazy-loaded only where needed | [`animation-design.md`](./animation-design.md) §6.1 |
| Lenis | < 5 KB gzip | Lazy, desktop only | [`animation-design.md`](./animation-design.md) §6.1 |
| Per-frame JS work | < 4ms | rAF batching, no layout thrash | [`animation-design.md`](./animation-design.md) §6.1 |
| 3D background frame cost | < 2ms | Instancing + shared material | [`devops-background.md`](./devops-background.md) §7.3 |
| Static fallback image | < 300 KB | AVIF primary, WebP fallback | [`devops-background.md`](./devops-background.md) §8.2 |

### 1.3 The Frame Budget (60 FPS = 16.6ms)

All 3D systems share one `useFrame` loop. No single system monopolizes it (per [`threejs-architecture.md`](./threejs-architecture.md) §10.2):

| System | Max Budget | Strategy |
|--------|-----------|----------|
| Camera | 0.5ms | Damped lerp (cheap) |
| Lighting | 0ms | Static — no per-frame work |
| Particles | 1ms | GPU-only (shader) |
| Background | 0.5ms | Shader-only |
| Effects | 2ms | Composer pass |
| Mouse | 0.5ms | Single raycast |
| Scroll | 0.5ms | Read + damp |
| **Total** | **~5ms** | Leaves ~11ms for render |

**Rule:** Any frame > 16ms on desktop is a bug (per [`animation-design.md`](./animation-design.md) §6.7).

---

## 2. Lazy Loading

### 2.1 Principle

Nothing the user cannot see yet should cost them bytes or main-thread time. Lazy loading defers below-the-fold content, heavy 3D, and non-critical libraries until they are needed or idle.

### 2.2 Techniques

| What | How | Trigger | Source |
|------|-----|---------|--------|
| 3D canvas | `next/dynamic` + React `Suspense` | After LCP (post-interactive) | [`hero-design.md`](./hero-design.md) §11.2, [`architecture.md`](./architecture.md) §5.1 |
| Below-the-fold sections | `next/dynamic` with `ssr: false` where client-only | Intersection Observer / scroll | [`architecture.md`](./architecture.md) §9.2 |
| GSAP + ScrollTrigger | `next/dynamic` on pages that use them | Route entry (Experience, Hero) | [`animation-design.md`](./animation-design.md) §6.6 |
| Lenis smooth scroll | Dynamic `import()` in `useEffect` | Desktop, non-reduced-motion only | [`animation-design.md`](./animation-design.md) §6.6 |
| Custom cursor | Tiny client component | After hydration | [`animation-design.md`](./animation-design.md) §6.6 |
| 3D models (GLB) | `useModel()` + Suspense bridge | Component requests key | [`threejs-architecture.md`](./threejs-architecture.md) §7.4 |
| HDR environments | Lazy-loaded, RGBE compressed | Scene mount | [`threejs-architecture.md`](./threejs-architecture.md) §3.5 |
| Blog MDX | Route-level code splitting | Navigation to `/blog/[slug]` | [`roadmap.md`](./roadmap.md) §5.2 |
| Route prefetching | `next/link` prefetch | Viewport proximity | [`architecture.md`](./architecture.md) §9.2 |

### 2.3 The 3D Mount Gate

The 3D canvas **never** mounts during initial render. Sequence (per [`architecture.md`](./architecture.md) §5.1):

1. Server renders text + 2D shell (LCP = hero `<h1>` name).
2. Hydration completes.
3. `requestIdleCallback` (or a 1-frame `setTimeout`) triggers the dynamic 3D import.
4. `<Loader3D>` shows progress while the scene + assets resolve.
5. Scene fades in over `duration-cinematic` (640ms).

### 2.4 Rules

- **LCP element is text, never 3D.** The hero name renders immediately with zero asset dependency (per [`hero-design.md`](./hero-design.md) §11.1).
- **3D is progressive enhancement.** Content is fully usable without it (per [`architecture.md`](./architecture.md) §2.2).
- **Every lazy boundary has a fallback.** Suspense fallbacks are meaningful, not blank (per [`threejs-architecture.md`](./threejs-architecture.md) §12).
- **Prefetch is opt-in per route.** Only likely-next routes prefetch; no eager prefetching of the entire nav.
- **`prefers-reduced-motion` short-circuits 3D load.** Static image fallback renders instead (per [`threejs-architecture.md`](./threejs-architecture.md) §12).

---

## 3. Dynamic Imports

### 3.1 Principle

Dynamic imports (`next/dynamic`, `import()`) split the bundle so the initial payload stays under 150 KB gzip. Heavy, route-specific, or client-only code lives in its own chunk.

### 3.2 Import Strategy Matrix

| Module | Strategy | Rationale |
|--------|----------|-----------|
| `@react-three/fiber`, `@react-three/drei`, `three` | `next/dynamic({ ssr: false })` | 3D is client-only; never SSR'd |
| `@react-three/postprocessing` | Dynamic inside 3D chunk | Effects are the most expensive layer |
| `gsap` + `ScrollTrigger` | `next/dynamic` per page | Only Experience + Hero use it |
| `lenis` | `import()` in `useEffect` | Desktop, non-reduced only |
| Syntax highlighter (Shiki/Prism) | `next/dynamic` on blog post | Heavy; only `/blog/[slug]` needs it |
| `react-hook-form` + `zod` (form chunk) | Dynamic on `/contact` | Form is one route |
| Custom cursor component | `next/dynamic({ ssr: false })` | Post-hydration only |
| Charts / contribution graph | `next/dynamic` | Future Phase 2, lazy |

### 3.3 Code-Split Boundaries

```
Initial chunk (≤150 KB gzip)
├── React + Next runtime
├── Framer Motion (core primitives)
├── Tailwind CSS (purged)
└── App shell (Header/Footer/Nav)

Lazy chunks
├── 3D chunk (R3F + three + drei + postprocessing)
├── GSAP chunk (core + ScrollTrigger)
├── Lenis chunk (desktop scroll)
├── Form chunk (RHF + Zod + contact UI)
├── Blog chunk (MDX + syntax highlighter)
└── Per-route page chunks
```

### 3.4 Rules

- **Server Components by default.** `"use client"` only on leaves that need interactivity (per [`coding-standards.md`](./coding-standards.md) §4.1, [`architecture.md`](./architecture.md) §2.1).
- **`ssr: false` for anything touching `window`/`document`/WebGL.** Prevents SSR hydration mismatches.
- **No dynamic import of tiny modules.** Splitting overhead exceeds savings below ~2 KB.
- **Name chunks for debuggability.** Use webpack magic comments: `/* webpackChunkName: "3d-scene" */`.
- **Bundle analyzer runs in CI.** `@next/bundle-analyzer` on every PR; regression > 5 KB blocks merge.

---

## 4. Instancing

### 4.1 Principle

When the same geometry renders many times, draw it once with instanced attributes — not as N separate meshes. One draw call beats N draw calls.

### 4.2 Application in Kandarp OS

| Scene | What is Instanced | Count | Source |
|-------|-------------------|-------|--------|
| DevOps constellation | Same-icon medallions (e.g., 4 AWS hexagons) | Per-icon groups | [`devops-background.md`](./devops-background.md) §7.2 |
| Particle systems | `THREE.Points` with `BufferGeometry` | 200–1000 | [`threejs-architecture.md`](./threejs-architecture.md) §4.4 |
| Project orbs (future) | Repeated orb geometry | N projects | [`threejs-architecture.md`](./threejs-architecture.md) §7.5 |
| Depth parallax planes | Background layer quads | 2–3 | [`threejs-architecture.md`](./threejs-architecture.md) §5.2 |

### 4.3 Implementation Contract

| Aspect | Approach |
|--------|----------|
| Geometry | Single `BufferGeometry` shared across instances |
| Transforms | `InstancedBufferAttribute` for per-instance matrix (position, rotation, scale) |
| Material | **One shared material instance** — never per-instance materials (per [`devops-background.md`](./devops-background.md) §7.2) |
| Update | GPU-side via vertex shader; no per-instance JS in the render loop |
| Culling | Frustum cull the whole instanced system as one draw call |
| Count scaling | Tier-scaled: high=full, med=50%, low=25%, off=0 (per [`threejs-architecture.md`](./threejs-architecture.md) §4.5) |

### 4.4 Rules

- **One draw call per particle system.** Never instantiate per-particle meshes (per [`threejs-architecture.md`](./threejs-architecture.md) §4.5).
- **All medallions share ONE material.** Only geometry differs (per [`devops-background.md`](./devops-background.md) §13.9).
- **Per-shell geometry merge** where instancing isn't applicable (per [`devops-background.md`](./devops-background.md) §7.2).
- **No per-instance JS in `useFrame`.** Motion lives in shaders or instanced matrices updated in bulk.
- **Instance count is tier-gated.** Low-end devices get fewer instances, not slower ones.

---

## 5. LOD (Level of Detail)

### 5.1 Principle

Render high-poly geometry only when the camera is close enough for the detail to matter. Far objects use low-poly meshes or billboards. This caps vertex throughput and fill rate.

### 5.2 LOD Strategy

| Object | High LOD | Low LOD | Fallback | Source |
|--------|----------|---------|----------|--------|
| DevOps icon shells | Near shell = high-poly | Far shell = low-poly or billboards | Static image | [`devops-background.md`](./devops-background.md) §7.2 |
| Hero orb | High-detail GLB | Low-detail GLB | Static image | [`threejs-architecture.md`](./threejs-architecture.md) §7.5, §11 |
| Crystal (decorative) | High-poly | Low-poly | — | [`threejs-architecture.md`](./threejs-architecture.md) §7.3 |
| Particles | Full count | 50% / 25% | 0 (off) | [`threejs-architecture.md`](./threejs-architecture.md) §11 |
| Shadows | 2048 map | 1024 map | Off | [`threejs-architecture.md`](./threejs-architecture.md) §2.5, §11 |
| Effects | Full stack | Clean preset | Off | [`threejs-architecture.md`](./threejs-architecture.md) §6.4, §11 |
| Environment | HDRI | HDRI | Procedural gradient | [`threejs-architecture.md`](./threejs-architecture.md) §11 |
| Anti-alias | MSAA 4x | SMAA | Off | [`threejs-architecture.md`](./threejs-architecture.md) §11 |

### 5.3 Two LOD Axes

Kandarp OS uses LOD along **two independent axes**:

1. **Distance LOD** — `THREE.LOD` swaps geometry by camera distance (standard Three.js).
2. **Device-tier LOD** — the `PerformanceGate` swaps the *entire* quality tier by device capability (per [`threejs-architecture.md`](./threejs-architecture.md) §11). This is the dominant axis for a portfolio where most objects are mid-distance.

### 5.4 Tier → LOD Mapping

| Tier | Device | Models | Pixel Ratio | Frame Target |
|------|--------|--------|-------------|--------------|
| High | Desktop GPU | High LOD | 2 | 60fps |
| Medium | Laptop / high mobile | Low LOD | 1.5 | 60fps |
| Low | Low mobile | Static image | 1 | 30fps |
| Off | No WebGL | Image | — | — |

### 5.5 Rules

- **Every model ships high + low LOD.** Single-LOD models are rejected (per [`threejs-architecture.md`](./threejs-architecture.md) §7.5).
- **LOD swaps are seamless.** No popping — cross-fade or swap at camera distances where the difference is imperceptible.
- **Tier downgrade is automatic.** If FPS < 30 for 2s, drop a tier (per [`threejs-architecture.md`](./threejs-architecture.md) §11).
- **Billboards for far detail.** Beyond a threshold, a textured quad beats a low-poly mesh.
- **Shadows, effects, and AA are LOD-gated too.** LOD is not just geometry (per [`threejs-architecture.md`](./threejs-architecture.md) §11).

---

## 6. Tree Shaking

### 6.1 Principle

Ship only the code that runs. Dead code elimination removes unused exports from the bundle — but only if imports are written to permit it.

### 6.2 Techniques

| Technique | Application | Source |
|-----------|-------------|--------|
| Named imports | `import { motion } from "framer-motion"` (not `import * as`) | [`coding-standards.md`](./coding-standards.md) §6 |
| `import type` for types | Types stripped at compile time, zero runtime cost | [`coding-standards.md`](./coding-standards.md) §6.3 |
| Lucide React named imports | `import { Github } from "lucide-react"` — tree-shakeable | [`architecture.md`](./architecture.md) §14 |
| ESM-only deps | Prefer ESM packages; CJS defeats tree shaking | — |
| Side-effect-free modules | `"sideEffects": false` in `package.json` where safe | — |
| Barrel file caution | Avoid `index.ts` re-exports that pull entire libraries | — |
| `optimizePackageImports` | Next.js `framer-motion`, `lucide-react` optimizations | `next.config.mjs` |
| Modular Three.js imports | `import * as THREE from "three"` is acceptable (tree-shakeable since r150+) but prefer specific imports for clarity | [`threejs-architecture.md`](./threejs-architecture.md) |

### 6.3 Next.js Configuration

Enable in [`next.config.mjs`](../next.config.mjs):

```js
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};
```

### 6.4 Rules

- **No `import * as` for app code.** Use named imports (per [`coding-standards.md`](./coding-standards.md) §6).
- **Types use `import type`.** Always — zero runtime cost (per [`coding-standards.md`](./coding-standards.md) §6.3).
- **No barrel re-exports of heavy libs.** A barrel that re-exports `three` defeats shaking.
- **Audit bundle quarterly.** `@next/bundle-analyzer` report reviewed for dead chunks.
- **ESLint `no-unused-imports`** enabled — unused imports are lint errors, not warnings.

---

## 7. Image Optimization

### 7.1 Principle

Images are the heaviest assets on most pages. `next/image` handles format negotiation, responsive sizing, lazy loading, and CLS prevention in one primitive.

### 7.2 Strategy

| Image Type | Format | Component | Priority | Source |
|------------|--------|-----------|----------|--------|
| Hero portrait | AVIF → WebP | `next/image` | `priority` + blur placeholder | [`hero-design.md`](./hero-design.md) §11.2 |
| LCP image | AVIF → WebP | `next/image` | `priority` | [`architecture.md`](./architecture.md) §9.1 |
| Below-the-fold images | AVIF → WebP | `next/image` | lazy (default) | [`architecture.md`](./architecture.md) §9.2 |
| 3D textures | KTX2 (in models) | GLB loader | lazy | [`threejs-architecture.md`](./threejs-architecture.md) §7.6 |
| Static 3D fallback | AVIF → WebP | `next/image` | lazy | [`devops-background.md`](./devops-background.md) §8.2 |
| OG / social cards | PNG/JPG | static | — | [`roadmap.md`](./roadmap.md) §4.9 |
| Icons | SVG (inline) | Lucide React | inline | [`architecture.md`](./architecture.md) §14 |

### 7.3 `next/image` Configuration

In [`next.config.mjs`](../next.config.mjs):

```js
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
},
```

### 7.4 Rules

- **`next/image` always.** No raw `<img>` except external/uncontrolled URLs (per [`coding-standards.md`](./coding-standards.md) §9, §15).
- **AVIF primary, WebP fallback.** Format negotiation is automatic (per [`architecture.md`](./architecture.md) §9.2).
- **`priority` only on LCP.** Above-the-fold hero portrait gets `priority`; everything else lazy-loads.
- **Blur placeholders on every image.** Prevents CLS and perceived jank (per [`hero-design.md`](./hero-design.md) §11.2).
- **Explicit `width`/`height`.** Zero CLS — dimensions reserved before load.
- **No PNG/JPG textures in 3D models.** KTX2 only (per [`threejs-architecture.md`](./threejs-architecture.md) §7.6).
- **Static fallback image < 300 KB** (per [`devops-background.md`](./devops-background.md) §8.2).
- **LCP image < 200 KB** (per [`architecture.md`](./architecture.md) §9.1).

---

## 8. Three.js Optimization

### 8.1 Principle

The 3D layer is the biggest performance risk. It is isolated in `src/3d/`, tier-gated, frame-budgeted, and fallback-mandated. Every system declares a `quality` tier; the `PerformanceGate` decides what runs (per [`threejs-architecture.md`](./threejs-architecture.md) §0).

### 8.2 Optimization Techniques

| Technique | Application | Source |
|-----------|-------------|--------|
| Draco compression | All mesh geometry | [`threejs-architecture.md`](./threejs-architecture.md) §7.5, §7.6 |
| KTX2 textures | All textures in models | [`threejs-architecture.md`](./threejs-architecture.md) §7.6 |
| Meshopt compression | Additional geometry compression | [`threejs-architecture.md`](./threejs-architecture.md) §7.5 |
| Instancing | Repeated models/particles | [`threejs-architecture.md`](./threejs-architecture.md) §7.5, [§4](#4-instancing) |
| Frustum culling | Automatic (Three.js default) | [`threejs-architecture.md`](./threejs-architecture.md) §7.5 |
| LOD | High/low models by tier + distance | [`threejs-architecture.md`](./threejs-architecture.md) §7.5, [§5](#5-lod-level-of-detail) |
| Shared materials | One material per object class | [`devops-background.md`](./devops-background.md) §7.2 |
| Geometry merging | Per-shell merge where possible | [`devops-background.md`](./devops-background.md) §7.2 |
| Pixel ratio cap | `Math.min(devicePixelRatio, 2)` | [`devops-background.md`](./devops-background.md) §7.2 |
| GPU-only motion | All particle/background motion in shaders | [`threejs-architecture.md`](./threejs-architecture.md) §4.4, §5.5 |
| Single rAF loop | Lenis + R3F share one loop | [`animation-design.md`](./animation-design.md) §7.3 |
| Throttled raycasting | Once per frame against registered targets only | [`threejs-architecture.md`](./threejs-architecture.md) §8.5 |
| Damped motion | `lerp`/`damp`, no instant snaps | [`threejs-architecture.md`](./threejs-architecture.md) §1.5 |
| Shadow tier-gating | Off on mobile/low-end | [`threejs-architecture.md`](./threejs-architecture.md) §2.6 |
| Effect tier-gating | Mobile gets `clean` or `off` | [`threejs-architecture.md`](./threejs-architecture.md) §6.5 |
| Model caching | By URL — load once, reuse everywhere | [`threejs-architecture.md`](./threejs-architecture.md) §7.4, §7.6 |
| Off-thread decode | Draco/KTX2 decode off main thread | [`threejs-architecture.md`](./threejs-architecture.md) §7.4 |

### 8.3 The PerformanceGate

Detection sequence (per [`threejs-architecture.md`](./threejs-architecture.md) §11):

1. Check WebGL support → absent renders 2D fallback.
2. Check `navigator.hardwareConcurrency` + `deviceMemory`.
3. Check `renderer.capabilities` (max texture size, extensions).
4. Run a 1-second benchmark on first frame → adjust tier dynamically.
5. Monitor FPS → if < 30 for 2s, downgrade tier.

### 8.4 The Fallback Chain

Every 3D scene degrades gracefully (per [`threejs-architecture.md`](./threejs-architecture.md) §12):

```
Full 3D (R3F)
    │ no WebGL / low tier
    ▼
Static 3D render (pre-rendered image)
    │ reduced motion
    ▼
CSS gradient + static image
```

### 8.5 Rules

- **Models are never imported as JS modules.** Always loaded from `/public/models/` (per [`threejs-architecture.md`](./threejs-architecture.md) §7.6).
- **All models must be Draco-compressed.** Uncompressed GLBs rejected in CI (per [`threejs-architecture.md`](./threejs-architecture.md) §7.6).
- **Textures must be KTX2.** PNG/JPG textures in models banned (per [`threejs-architecture.md`](./threejs-architecture.md) §7.6).
- **One model per file.** Multi-mesh files split at the asset level (per [`threejs-architecture.md`](./threejs-architecture.md) §7.6).
- **Shaders do the heavy lifting.** CPU stays out of the render loop (per [`threejs-architecture.md`](./threejs-architecture.md) §15.5).
- **No per-frame light changes** unless animating a specific effect (per [`threejs-architecture.md`](./threejs-architecture.md) §2.6).
- **`prefers-reduced-motion` is sacred.** Disables parallax, particles, effects, typing (per [`threejs-architecture.md`](./threejs-architecture.md) §15.10, [`animation-design.md`](./animation-design.md) §5).
- **One frame budget, shared fairly.** No system monopolizes (per [`threejs-architecture.md`](./threejs-architecture.md) §15.8).

---

## 9. Reaching 95 Lighthouse

### 9.1 Category Breakdown

| Category | Target | Primary Levers |
|----------|--------|----------------|
| Performance | ≥ 95 | [Lazy Loading](#2-lazy-loading), [Dynamic Imports](#3-dynamic-imports), [Image Optimization](#7-image-optimization), [Tree Shaking](#6-tree-shaking) |
| Accessibility | ≥ 95 | Semantic HTML, ARIA, keyboard nav, contrast, reduced-motion (per [`roadmap.md`](./roadmap.md) §6.4) |
| Best Practices | ≥ 95 | HTTPS, no console errors, no vulnerable deps, `npm audit` clean (per [`architecture.md`](./architecture.md) §10) |
| SEO | ≥ 95 | `generateMetadata`, OG/Twitter cards, `sitemap.xml`, `robots.txt`, JSON-LD (per [`roadmap.md`](./roadmap.md) §4.9) |

### 9.2 Performance Sub-Metrics

| Metric | Target | Lever |
|--------|--------|-------|
| LCP | < 1.2s | Text LCP, `priority` image, `next/font` preload |
| FCP | < 0.8s | SSG/ISR, lean initial JS |
| TBT | < 200ms | Dynamic imports, no long tasks, deferred 3D |
| CLS | 0 | `next/image` dimensions, `transform`/`opacity` only |
| INP | < 200ms | 120ms hover feedback, no animation blocks input |
| Speed Index | < 1.5s | Above-the-fold lean, below-the-fold deferred |

### 9.3 CI Enforcement

| Gate | Tool | Cadence | Source |
|------|------|---------|--------|
| Lighthouse CI | `@lhci/cli` on preview builds | Every PR | [`roadmap.md`](./roadmap.md) §3.3, [`architecture.md`](./architecture.md) §11 |
| Bundle budget | `@next/bundle-analyzer` | Every PR | [`roadmap.md`](./roadmap.md) §6.3 |
| a11y audit | axe-core in CI | Every PR | [`roadmap.md`](./roadmap.md) §8 |
| Type check | `tsc --noEmit` | Every PR | [`coding-standards.md`](./coding-standards.md) §16 |
| Lint | `next lint` | Every PR + pre-commit | [`coding-standards.md`](./coding-standards.md) §16 |
| Dep audit | `npm audit` | Weekly | [`architecture.md`](./architecture.md) §10 |

### 9.4 Lighthouse CI Config

Config lives at [`config/lighthouse.json`](../config/lighthouse.json) (per [`folder-structure.md`](./folder-structure.md) §7). Asserted budgets:

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 1200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    }
  }
}
```

---

## 10. Reaching 60 FPS

### 10.1 The Two Domains

| Domain | Target | Owner | Lever |
|--------|--------|-------|-------|
| DOM/UI animation | 60fps | Framer Motion | `transform`/`opacity` only, compositor-friendly |
| 3D render | 60fps desktop / 30fps mobile | R3F | [Three.js Optimization](#8-threejs-optimization) |

### 10.2 DOM Animation Rules (per [`animation-design.md`](./animation-design.md) §6.3)

- **Always animate `transform` and `opacity`.** Compositor-friendly — no layout/paint.
- **Promote layers sparingly.** `will-change: transform` only on actively animating elements; remove after.
- **No `backdrop-filter` animation.** Glass blur is static; only the sheen overlay animates.
- **`contain: layout style paint`** on scroll containers to limit repaint scope.
- **No animating `width`/`height`/`top`/`left`** except the accordion exception (per [`animation-design.md`](./animation-design.md) §6.4).

### 10.3 3D Frame Budget (per [`threejs-architecture.md`](./threejs-architecture.md) §10.2)

See [§1.3](#13-the-frame-budget-60-fps--166ms). Total system budget ~5ms leaves ~11ms for render.

### 10.4 Scroll Performance (per [`animation-design.md`](./animation-design.md) §6.5)

- **Single rAF loop.** Lenis + R3F share it; Framer runs its own internal loop.
- **`useScroll` + `useTransform`** read `scrollY` passively into `MotionValue`s — no React re-render per frame.
- **`passive: true`** on all scroll listeners.
- **Throttle scroll handlers:** progress bar via rAF, scrollspy debounced 100ms.

### 10.5 Monitoring

| Metric | Target | Tool | Source |
|--------|--------|------|--------|
| Frame time | < 16ms desktop | DevTools Performance tab | [`animation-design.md`](./animation-design.md) §6.7 |
| 3D frame cost | < 2ms (background) | R3F `useFrame` profiling | [`devops-background.md`](./devops-background.md) §7.3 |
| FPS | 60 desktop / 30 mobile | `PerformanceMonitor` component | [`component-inventory.md`](./component-inventory.md) |
| Auto-downgrade | < 30fps for 2s → drop tier | `PerformanceGate` | [`threejs-architecture.md`](./threejs-architecture.md) §11 |

---

## 11. Implementation Phasing

This plan maps to [`roadmap.md`](./roadmap.md) Phase 3 (Polish & Performance). Sequenced for compounding gains:

| Phase | Pillar | Outcome | Roadmap Link |
|-------|--------|---------|--------------|
| 3.1 | Tree Shaking + Dynamic Imports | Initial JS < 150 KB | [`roadmap.md`](./roadmap.md) §6.3 |
| 3.2 | Image Optimization | LCP < 1.2s, CLS 0 | [`roadmap.md`](./roadmap.md) §6.3 |
| 3.3 | Lazy Loading | 3D deferred post-LCP | [`roadmap.md`](./roadmap.md) §6.1 |
| 3.4 | Three.js Optimization (Draco/KTX2) | 3D assets < 2 MB | [`roadmap.md`](./roadmap.md) §6.3 |
| 3.5 | Instancing + LOD | 3D background < 2ms/frame | [`roadmap.md`](./roadmap.md) §6.1 |
| 3.6 | Lighthouse CI enforcement | ≥ 95 all categories | [`roadmap.md`](./roadmap.md) §6.3 |
| 3.7 | FPS monitoring + auto-tier | 60fps desktop / 30fps mobile | [`roadmap.md`](./roadmap.md) §6.5 |

---

## 12. Acceptance Checklist

A route is "optimized" when all of the following pass:

### 12.1 Lighthouse (≥ 95)
- [ ] Performance ≥ 95
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO ≥ 95
- [ ] LCP < 1.2s on 4G
- [ ] CLS = 0
- [ ] TBT < 200ms
- [ ] INP < 200ms

### 12.2 Bundle
- [ ] Initial JS < 150 KB gzip
- [ ] Initial CSS < 30 KB gzip
- [ ] No bundle regression > 5 KB vs main
- [ ] 3D in separate lazy chunk
- [ ] GSAP/Lenis in separate lazy chunks

### 12.3 Images
- [ ] All images via `next/image`
- [ ] AVIF primary, WebP fallback
- [ ] LCP image has `priority`
- [ ] All images have blur placeholder + explicit dimensions
- [ ] No PNG/JPG textures in 3D models (KTX2 only)

### 12.4 3D
- [ ] All models Draco-compressed
- [ ] All textures KTX2
- [ ] 3D mounts post-LCP via dynamic import
- [ ] `PerformanceGate` assigns tier
- [ ] Fallback chain works (3D → image → CSS)
- [ ] `prefers-reduced-motion` respected
- [ ] Frame budget < 5ms (systems) + < 11ms (render)
- [ ] 3D background < 2ms/frame

### 12.5 Animation
- [ ] Only `transform`/`opacity` animated (accordion exception documented)
- [ ] Single rAF loop (Lenis + R3F)
- [ ] `passive: true` on scroll listeners
- [ ] `will-change` removed when not animating
- [ ] `contain` on scroll containers

---

## 13. Rules Summary

1. **Performance is architecture, not a final pass.** Budgets are defined before code is written.
2. **LCP is text, never 3D.** The hero name renders with zero asset dependency.
3. **3D is progressive enhancement.** Content is fully usable without it.
4. **Everything heavy is lazy.** 3D, GSAP, Lenis, syntax highlighters — all dynamically imported.
5. **One draw call per repeated geometry.** Instancing + shared materials.
6. **Every model ships high + low LOD.** Tier-gated and distance-gated.
7. **Ship only what runs.** Named imports, `import type`, no barrel re-exports of heavy libs.
8. **`next/image` always.** AVIF primary, dimensions reserved, blur placeholders.
9. **Shaders do the heavy lifting.** CPU stays out of the render loop.
10. **One frame budget, shared fairly.** No system monopolizes the 16.6ms.
11. **Everything has a fallback.** No visitor is blocked by 3D or a weak GPU.
12. **`prefers-reduced-motion` is sacred.** Static, beautiful, fully functional — never broken.
13. **Lighthouse CI is the gate.** ≥ 95 enforced on every PR; regressions block merge.
14. **Measure before optimizing.** DevTools + Lighthouse + bundle analyzer drive decisions.

---

_This plan is the performance contract for Kandarp OS. Every optimization decision traces back to a pillar defined here. When a technique is added, update this document — not just the code._
