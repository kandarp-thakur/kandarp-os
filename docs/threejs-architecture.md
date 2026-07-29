# Three.js Architecture — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Stack:** React Three Fiber (R3F) · Three.js · `@react-three/drei` · `@react-three/postprocessing`
> **Scope:** Architecture only. No implementation code.

---

## 0. Architectural Overview

The 3D layer of Kandarp OS is a **modular, system-based** architecture. Each concern (camera, lighting, particles, etc.) is an isolated, composable system with a clear contract. Systems are assembled into **scenes**, which are mounted inside a single **Canvas3D** host.

```
┌─────────────────────────────────────────────────────────────┐
│                        Canvas3D (Host)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Camera  │  │ Lighting │  │Environment│  │  Effects   │  │
│  │  System  │  │  System  │  │  System   │  │  System    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬────┘  └─────┬──────┘  │
│       │              │              │              │         │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────┐  │
│  │                    Scene Graph                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │ Particles│  │Background│  │  Models  │  │ Objects│ │  │
│  │  │  System  │  │  System  │  │  System  │  │        │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │ Mouse Interaction│  │    Scroll Interaction System     │  │
│  │     System       │  │                                  │  │
│  └──────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles
1. **System isolation.** Each system owns its state and lifecycle. No cross-system direct mutation — communication via a shared event/state bus.
2. **Declarative-first.** Systems are composed as JSX in R3F. Imperative code lives in hooks, not components.
3. **Performance-gated.** Every system declares a `quality` tier (high/medium/low/off). The `PerformanceGate` decides what runs based on device capability.
4. **Fallback-mandated.** Every system has a 2D/CSS fallback. WebGL absence never blocks content.
5. **Frame-budget-aware.** Systems cooperate via a shared frame budget — no single system monopolizes the render loop.

---

## 1. Camera System

### 1.1 Purpose
A centralized camera controller that supports **cinematic movement**, **scroll-driven motion**, **mouse parallax**, and **scene transitions** — without each scene reimplementing camera logic.

### 1.2 Architecture

```
CameraSystem
├── CameraRig              # The orchestrator (single instance per canvas)
│   ├── CameraState        # Current target position, lookAt, FOV
│   ├── CameraController   # Smooth interpolation (damping) toward target
│   ├── CameraModes        # idle | scroll | cinematic | interactive
│   └── CameraConstraints  # Min/max distance, pitch clamp, FOV range
├── CameraPresets           # Named camera positions per scene
└── useCamera()            # Hook to read/steer camera from any system
```

### 1.3 Camera Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `idle` | Default | Gentle floating motion (breathing) |
| `scroll` | Page scroll | Position/rotation driven by scroll progress |
| `cinematic` | Scene transition | Animated path between presets |
| `interactive` | User drag | Orbit controls (desktop only) |

### 1.4 Camera Presets

Named, reusable camera configurations stored as data:

| Preset | Position | LookAt | FOV | Usage |
|--------|----------|--------|-----|-------|
| `hero-wide` | (0, 0, 8) | (0, 0, 0) | 50° | Hero scene default |
| `hero-close` | (0, 0, 5) | (0, 0, 0) | 45° | Hero on mobile |
| `projects-orbit` | (0, 2, 12) | (0, 0, 0) | 55° | Project orb scene |
| `detail-focus` | (0, 0, 4) | target | 40° | Focused object view |

### 1.5 Rules
- **One CameraRig per canvas.** It owns the camera; no other system mutates camera directly.
- **All motion is damped.** No instant snaps — use `lerp`/`damp` with configurable smoothing (default 0.1).
- **FOV is responsive.** Wider on mobile to compensate for small screens.
- **Orbit controls are desktop-only** and disabled during scroll-driven sections.
- **`prefers-reduced-motion`** disables idle breathing and parallax; camera holds static.

---

## 2. Lighting System

### 2.1 Purpose
A consistent, reusable lighting rig that gives every scene the same premium, glass-friendly look — soft, layered, and physically plausible.

### 2.2 Architecture

```
LightingSystem
├── LightingRig            # Orchestrator (single per scene)
│   ├── AmbientLight       # Base fill (low intensity)
│   ├── KeyLight           # Primary directional (main shadow caster)
│   ├── FillLight          # Secondary directional (softer, opposite side)
│   ├── RimLight           # Backlight for edge separation
│   └── AccentLight        # Colored point/spot for brand accent
├── LightingPresets        # Named lighting setups
└── useLighting()         # Hook to adjust lighting at runtime
```

### 2.3 Light Roles

| Light | Type | Color | Intensity | Shadow | Purpose |
|-------|------|-------|-----------|--------|---------|
| Ambient | Ambient | `#FFFFFF` | 0.4 | No | Base illumination |
| Key | Directional | `#FFFFFF` | 1.2 | Yes | Main light + shadows |
| Fill | Directional | `#EEF0FF` | 0.5 | No | Shadow detail |
| Rim | Directional | `#8B5CF6` | 0.8 | No | Edge highlight (accent) |
| Accent | Point | `#6366F1` | 2.0 | No | Brand glow on hero |

### 2.4 Lighting Presets

| Preset | Mood | Usage |
|--------|------|-------|
| `studio` | Bright, even, neutral | Default, product-like |
| `dramatic` | High contrast, strong rim | Hero, featured |
| `soft` | Diffused, low contrast | Ambient sections |
| `accent` | Colored accent dominant | Brand moments |

### 2.5 Shadow Configuration

| Property | Value | Rationale |
|----------|-------|-----------|
| Shadow map size | 2048 (high) / 1024 (med) / off (low) | Quality tiers |
| Shadow bias | -0.0001 | Prevent acne |
| Shadow radius | 4 | Soft edges |
| Shadow camera near/far | 0.5 / 50 | Tight frustum |
| Shadow camera bounds | ±10 | Focused on scene |

### 2.6 Rules
- **One LightingRig per scene.** Composed inside the scene, not the canvas root.
- **Shadows are tier-gated.** Off on mobile/low-end to save fill rate.
- **Accent light follows the brand gradient** — color shifts with theme.
- **No per-frame light changes** unless animating a specific effect (perf cost).

---

## 3. Environment System

### 3.1 Purpose
Provide realistic reflections, ambient image-based lighting (IBL), and scene atmosphere — the foundation that makes glass and metal materials look real.

### 3.2 Architecture

```
EnvironmentSystem
├── EnvironmentLoader      # Loads HDR environment maps
│   ├── PresetEnvironments  # Built-in drei presets (studio, city, sunset)
│   └── CustomHDRIs        # Project-specific HDR files in /public/textures/hdri/
├── EnvironmentProbe       # Reflection probe for dynamic objects
├── Atmosphere             # Fog, background color, gradient sky
└── useEnvironment()       # Hook to swap environments per scene
```

### 3.3 Environment Sources

| Source | Type | Size | Usage |
|--------|------|------|-------|
| `studio.hdr` | HDR | 1–2 MB | Default product lighting |
| `sunset.hdr` | HDR | 1–2 MB | Warm hero scenes |
| `gradient-env` | Procedural | 0 KB | Generated gradient cubemap |

### 3.4 Atmosphere Layer

| Element | Property | Value |
|---------|----------|-------|
| Fog | Type | `FogExp2` (exponential) |
| Fog | Color | Matches canvas base (`#FBFBFD`) |
| Fog | Density | 0.02 (subtle depth) |
| Background | Type | Gradient texture or solid |
| Background | Color | `#FBFBFD` (matches page) |

### 3.5 Rules
- **Environment is scene-scoped.** Each scene declares its environment.
- **HDRIs are compressed** (RGBE format) and lazy-loaded.
- **Procedural gradient environments** are preferred for abstract scenes (zero asset weight).
- **Background color always matches the page canvas** — seamless 3D-to-DOM blend.
- **Fog is optional** and tier-gated (off on low-end).

---

## 4. Particles System

### 4.1 Purpose
A flexible, GPU-friendly particle engine for ambient effects — floating dust, starfields, energy fields — without per-particle JS overhead.

### 4.2 Architecture

```
ParticlesSystem
├── ParticleEmitter         # Base emitter (position, rate, lifetime)
│   ├── GeometryPool        # BufferGeometry with pre-allocated attributes
│   ├── MaterialPool        # ShaderMaterial / PointsMaterial variants
│   └── Updater             # GPU-side position update (vertex shader)
├── ParticlePresets         # Named particle configurations
└── useParticles()          # Hook to spawn/control emitters
```

### 4.3 Particle Presets

| Preset | Count | Shape | Behavior | Usage |
|--------|-------|-------|----------|-------|
| `dust` | 200 | Point (soft) | Slow float, gravity drift | Ambient atmosphere |
| `stars` | 1000 | Point (small) | Static field, twinkle | Background space |
| `energy` | 300 | Point (glow) | Orbit + pulse | Hero accent |
| `confetti` | 150 | Plane | Burst + gravity | Celebration (rare) |
| `flow` | 500 | Point | Directional stream | Section transitions |

### 4.4 Implementation Strategy

| Aspect | Approach |
|--------|----------|
| **Geometry** | Single `BufferGeometry` with `position`, `velocity`, `lifetime`, `size` attributes |
| **Update** | Vertex shader moves particles (no JS per-frame loop) |
| **Rendering** | `THREE.Points` with custom `ShaderMaterial` |
| **Culling** | Frustum cull the whole system (one draw call) |
| **Sizing** | `sizeAttenuation: true` for depth realism |

### 4.5 Rules
- **One draw call per particle system.** Never instantiate per-particle meshes.
- **Particle count is tier-scaled:** high=full, med=50%, low=25%, off=0.
- **Particles respect `prefers-reduced-motion`** — static or disabled.
- **No particle physics on CPU.** All motion in shaders.
- **Soft particles** use a circular alpha falloff texture (no square points).

---

## 5. Background System

### 5.1 Purpose
The visual canvas behind all 3D objects — gradients, animated shaders, and depth layers that create the "world" the user inhabits.

### 5.2 Architecture

```
BackgroundSystem
├── BackgroundLayer         # Base layer (always present)
│   ├── GradientBackground  # Animated CSS-like gradient via shader
│   ├── SolidBackground    # Fallback solid color
│   └── TextureBackground  # Image-based background
├── DepthLayers             # Parallax background planes (2–3 layers)
├── AnimatedGradient       # Time-shifting gradient (signature)
└── useBackground()        # Hook to transition backgrounds
```

### 5.3 Layer Stack

```
┌─────────────────────────────┐  Layer 3 (back):  Gradient shader (animated)
├─────────────────────────────┤  Layer 2:        Depth plane (parallax far)
├─────────────────────────────┤  Layer 1:        Depth plane (parallax near)
├─────────────────────────────┤  Layer 0 (front): 3D objects + particles
└─────────────────────────────┘
```

### 5.4 Gradient Shader

| Property | Value |
|----------|-------|
| Colors | Brand accent gradient (`#6366F1` → `#8B5CF6` → `#EC4899`) |
| Animation | Slow hue rotation + position drift (60s loop) |
| Noise | Subtle fractal noise overlay (5% opacity) |
| Format | Full-screen quad with custom fragment shader |

### 5.5 Rules
- **Background is always present** — even with no 3D objects, the gradient renders.
- **Background renders first** (renderOrder = -1) and ignores depth test.
- **Gradient animation is GPU-only** — no JS per-frame updates.
- **Depth layers parallax with scroll** (see Scroll Interaction System).
- **Background color syncs with theme** — light/dark swap.

---

## 6. Effects System (Post-Processing)

### 6.1 Purpose
Cinematic post-processing — bloom, depth of field, chromatic aberration, noise — applied as a final render pass to give the scene polish and mood.

### 6.2 Architecture

```
EffectsSystem
├── EffectComposer          # Orchestrates the render pipeline
│   ├── BloomPass           # Glow on bright/accent areas
│   ├── DOFPass             # Depth of field (focus blur)
│   ├── VignettePass        | Edge darkening
│   ├── ChromaticAberration # Subtle RGB split on edges
│   ├── NoisePass           # Film grain
│   └── SMAAPass            # Anti-aliasing
├── EffectPresets          # Named effect stacks
└── useEffects()           # Hook to toggle/adjust effects
```

### 6.3 Effect Stack (Default)

| Effect | Enabled | Intensity | Purpose |
|--------|---------|-----------|---------|
| Bloom | ✅ | 0.6 | Accent glow (signature) |
| DOF | ❌ (scene-specific) | 0.3 | Focus on hero object |
| Vignette | ✅ | 0.3 | Frame the scene |
| Chromatic Aberration | ✅ | 0.002 | Subtle lens realism |
| Noise | ✅ | 0.04 | Film grain texture |
| SMAA | ✅ | — | Edge smoothing |

### 6.4 Effect Presets

| Preset | Stack | Usage |
|--------|-------|-------|
| `cinematic` | Bloom + DOF + Vignette + Noise | Hero, featured |
| `clean` | Bloom + SMAA only | Default, performant |
| `dreamy` | Bloom (high) + DOF + Noise | Ambient sections |
| `off` | None | Low-end devices |

### 6.5 Rules
- **Effects are the most expensive layer.** Tier-gated aggressively.
- **Bloom is the signature effect** — always on for high/medium tiers.
- **DOF is scene-specific** — never global (perf cost).
- **Effect order matters** — defined in the composer, not arbitrary.
- **`prefers-reduced-motion`** disables noise animation and chromatic shift.
- **Mobile gets `clean` or `off`** — never the full stack.

---

## 7. Models System

### 7.1 Purpose
A centralized model management system — loading, caching, instancing, and lifecycle — so 3D models are loaded once, reused everywhere, and never block the main thread.

### 7.2 Architecture

```
ModelsSystem
├── ModelRegistry           # Maps model keys to URLs + configs
├── ModelLoader             # GLTF loader with Draco + KTX2 support
│   ├── SuspenseBridge      # Integrates with React Suspense
│   ├── CacheLayer          # Deduplicates + caches loaded models
│   └── ProgressTracker     # Per-model load progress
├── ModelInstance           # Wraps a loaded model for placement
├── ModelOptimizer          # Meshopt compression, instancing
└── useModel()              # Hook to access loaded models
```

### 7.3 Model Registry

| Key | File | Format | Size | Usage |
|-----|------|--------|------|-------|
| `hero-orb` | `/models/orb.glb` | GLB + Draco | ~200 KB | Hero centerpiece |
| `crystal` | `/models/crystal.glb` | GLB + Draco | ~150 KB | Decorative |
| `text-3d` | generated | procedural | 0 KB | 3D headings |

### 7.4 Loading Strategy

| Stage | Action |
|-------|--------|
| 1. Register | Model key + URL added to registry at build time |
| 2. Request | Component calls `useModel(key)` |
| 3. Load | Loader fetches + decodes (Draco/KTX2) off main thread |
| 4. Cache | Decoded model stored in cache (keyed by URL) |
| 5. Suspend | Component suspends; `<Loader3D>` shows progress |
| 6. Resolve | Model instance provided to component |
| 7. Reuse | Subsequent requests hit cache (instant) |

### 7.5 Optimization

| Technique | Application |
|-----------|-------------|
| Draco compression | All mesh geometry |
| KTX2 textures | All textures in models |
| Meshopt | Additional geometry compression |
| Instancing | Repeated models (e.g., multiple orbs) |
| Frustum culling | Automatic (Three.js default) |
| LOD | High/low models swapped by device tier |

### 7.6 Rules
- **Models are never imported as JS modules.** Always loaded from `/public/models/`.
- **All models must be Draco-compressed.** Uncompressed GLBs are rejected in CI.
- **Textures must be KTX2.** PNG/JPG textures in models are banned.
- **One model per file.** Multi-mesh files are split at the asset level.
- **Models are cached by URL** — the same model used in two scenes loads once.
- **Loading is Suspense-integrated** — never blocks the page; shows fallback.

---

## 8. Mouse Interaction System

### 8.1 Purpose
A unified input layer that translates mouse/touch position into 3D-space data — for parallax, raycasting, magnetic effects, and object manipulation — consumed by all systems.

### 8.2 Architecture

```
MouseInteractionSystem
├── MouseTracker            # Normalized pointer position (-1 to 1)
│   ├── RawPosition         # Pixel coordinates
│   ├── NDCPosition         # Normalized device coords (for raycasting)
│   ├── SmoothedPosition    # Damped position (for parallax)
│   └── Velocity            # Movement speed (for effects)
├── Raycaster               # Object picking
│   ├── HoverDetector       # Pointer-enter/leave on 3D objects
│   ├── ClickDetector       # Click/tap on 3D objects
│   └── DragDetector        # Drag interactions
├── InteractionTargets      # Registry of interactive objects
└── useMouse()              # Hook to read mouse state
```

### 8.3 Data Flow

```
Pointer Event → MouseTracker → SmoothedPosition
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
              CameraSystem   ParticlesSystem  Objects
              (parallax)     (flow dir)       (raycast)
```

### 8.4 Interaction Types

| Type | Trigger | Response |
|------|---------|----------|
| **Parallax** | Mouse move | Camera/objects shift slightly (±0.5 units) |
| **Hover** | Pointer over object | Object scales/glows; cursor changes |
| **Click** | Click/tap on object | Navigate / open detail |
| **Drag** | Pointer down + move | Orbit camera or move object |
| **Magnetic** | Mouse near element | Element attracts toward cursor |
| **Repel** | Mouse near particles | Particles disperse |

### 8.5 Rules
- **Mouse tracking is throttled** to pointermove (no rAF polling).
- **Smoothed position uses `damp()`** — configurable smoothing (default 0.08).
- **Raycasting runs once per frame** against registered targets only (not full scene).
- **Touch is supported** — single-touch maps to mouse; pinch is separate.
- **`prefers-reduced-motion`** disables parallax and magnetic effects.
- **Mobile disables hover** — tap-only interactions.
- **Cursor states:** `default` → `pointer` (on hoverable) → `grab`/`grabbing` (draggable).

---

## 9. Scroll Interaction System

### 9.1 Purpose
The bridge between the 2D scroll world and the 3D scene — translating scroll position, velocity, and section progress into camera movement, object animation, and scene transitions.

### 9.2 Architecture

```
ScrollInteractionSystem
├── ScrollTracker           # Central scroll state
│   ├── ScrollProgress      # 0 → 1 across full page
│   ├── SectionProgress     # 0 → 1 per section
│   ├── ScrollVelocity      # Speed + direction
│   └── ScrollDirection     | up / down / idle
├── ScrollSections         # Registered sections with 3D hooks
│   ├── Section A (hero)   # Camera preset, object states
│   ├── Section B (projects) # Different camera, reveal objects
│   └── Section C (contact) # Final camera position
├── ScrollDriver            # Feeds scroll data into CameraSystem
└── useScroll()            # Hook to read scroll state
```

### 9.3 Data Flow

```
DOM Scroll → ScrollTracker → SectionProgress
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
        CameraSystem      Object States       EffectsSystem
        (move camera)     (reveal/hide)       (intensity)
```

### 9.4 Section Mapping

| Section | Scroll Range | Camera Preset | 3D Action |
|---------|-------------|---------------|-----------|
| Hero | 0.0 – 0.2 | `hero-wide` | Orb pulses, particles drift |
| About | 0.2 – 0.4 | `hero-close` | Orb rotates, text reveals |
| Projects | 0.4 – 0.7 | `projects-orbit` | Orbs arrange in space |
| Skills | 0.7 – 0.85 | `detail-focus` | Background dims |
| Contact | 0.85 – 1.0 | `hero-wide` | Orb returns, glows |

### 9.5 Scroll-Driven Behaviors

| Behavior | Input | Output |
|----------|-------|--------|
| **Camera dolly** | ScrollProgress | Camera Z position interpolates |
| **Camera orbit** | SectionProgress | Camera angle rotates per section |
| **Object reveal** | SectionProgress | Objects fade/scale in when section active |
| **Object hide** | SectionProgress | Objects fade out when section exits |
| **Parallax depth** | ScrollVelocity | Background layers shift |
| **Effect intensity** | ScrollVelocity | Bloom/noise increase on fast scroll |
| **Section transition** | Section boundary | Camera animates to next preset |

### 9.6 Rules
- **Scroll is the master clock** for 3D scene progression — not time.
- **Scroll data is smoothed** — raw scroll is jittery; damp to 0.1.
- **Section transitions are cinematic** — camera animates over 480ms between presets.
- **Scroll velocity drives effects** — fast scroll = more motion blur/bloom (subtle).
- **`prefers-reduced-motion`** — scroll still drives camera position, but no parallax/effects.
- **Mobile uses native scroll** — no scroll-jacking. 3D reacts to scroll, doesn't hijack it.
- **Scroll progress is shared** — DOM elements and 3D read the same value (single source of truth).

---

## 10. System Integration

### 10.1 Shared State Bus

Systems communicate via a **lightweight state bus** (React Context + refs), not direct calls:

```
┌──────────────┐   scrollProgress   ┌──────────────┐
│ ScrollSystem │ ─────────────────▶ │ CameraSystem │
└──────────────┘                    └──────────────┘
        │                                  ▲
        │ sectionProgress                  │ mousePosition
        ▼                                  │
┌──────────────┐   mousePosition    ┌──────────────┐
│ Objects      │ ◀──────────────── │ MouseSystem  │
└──────────────┘                    └──────────────┘
```

| Shared State | Producer | Consumers |
|--------------|----------|-----------|
| `scrollProgress` | ScrollSystem | Camera, Objects, Effects |
| `sectionProgress` | ScrollSystem | Objects, Particles |
| `mousePosition` | MouseSystem | Camera, Objects, Particles |
| `deviceTier` | PerformanceGate | All systems |
| `reducedMotion` | Browser | All systems |
| `theme` | ThemeProvider | Lighting, Background |

### 10.2 Frame Budget Cooperation

All systems run inside a single `useFrame` loop (R3F's). To prevent frame overruns:

| System | Max Budget | Strategy |
|--------|-----------|----------|
| Camera | 0.5ms | Damped lerp (cheap) |
| Lighting | 0ms (static) | No per-frame work |
| Particles | 1ms | GPU-only (shader) |
| Background | 0.5ms | Shader-only |
| Effects | 2ms | Composer pass |
| Mouse | 0.5ms | Single raycast |
| Scroll | 0.5ms | Read + damp |
| **Total** | **~5ms** | Leaves ~11ms for render (60fps) |

---

## 11. Performance Tiers

The `PerformanceGate` detects device capability and assigns a tier. Each system scales accordingly.

| Capability | High | Medium | Low | Off |
|------------|------|--------|-----|-----|
| **Device** | Desktop GPU | Laptop / high mobile | Low mobile | No WebGL |
| **Pixel ratio** | 2 | 1.5 | 1 | — |
| **Shadows** | 2048 map | 1024 map | Off | — |
| **Particles** | 100% | 50% | 25% | 0 |
| **Effects** | Full stack | Clean | Off | — |
| **Environment** | HDRI | HDRI | Procedural | — |
| **Models** | High LOD | Low LOD | Static image | Image |
| **Anti-alias** | MSAA 4x | SMAA | Off | — |
| **Frame target** | 60fps | 60fps | 30fps | — |

### Detection Strategy
1. Check `WebGL` support → if absent, render 2D fallback.
2. Check `navigator.hardwareConcurrency` + `deviceMemory`.
3. Check `renderer.capabilities` (max texture size, extensions).
4. Run a 1-second benchmark on first frame → adjust tier dynamically.
5. Monitor FPS → if < 30 for 2s, downgrade tier.

---

## 12. Fallback Strategy

Every 3D scene degrades gracefully:

```
Full 3D (R3F)
    │ if no WebGL / low tier
    ▼
Static 3D render (pre-rendered image)
    │ if reduced motion
    ▼
CSS gradient + static image
```

| Tier | Fallback |
|------|----------|
| High | Full R3F scene |
| Medium | R3F with reduced effects |
| Low | Pre-rendered 3D image (PNG/WebP) |
| Off | CSS gradient background + static hero image |

### Rules
- **Fallback is automatic** — no user action required.
- **Fallback content is meaningful** — not a blank box; shows the hero image.
- **Fallback is accessible** — all text content exists in DOM, not only in 3D.
- **A "View 3D experience" button** may offer to load 3D on low tiers (user opt-in).

---

## 13. File Mapping

Each system maps to the `src/3d/` folder structure:

| System | Folder | Key Files |
|--------|--------|-----------|
| Camera | `src/3d/` | `CameraRig.tsx`, `useCamera.ts` |
| Lighting | `src/3d/` | `LightingRig.tsx`, `useLighting.ts` |
| Environment | `src/3d/` | `Environment3D.tsx`, `useEnvironment.ts` |
| Particles | `src/3d/` | `ParticleEmitter.tsx`, `useParticles.ts` |
| Background | `src/3d/scenes/` | `GradientBackground.tsx`, `DepthLayer.tsx` |
| Effects | `src/3d/` | `PostProcessing.tsx`, `useEffects.ts` |
| Models | `src/3d/models/` | `ModelLoader.ts`, `ModelRegistry.ts`, `useModel.ts` |
| Mouse | `src/3d/hooks/` | `useMouse.ts`, `useRaycaster.ts` |
| Scroll | `src/3d/hooks/` | `useScroll.ts`, `useScrollSection.ts` |
| Shaders | `src/3d/shaders/` | `gradient.glsl`, `particles.glsl`, `noise.glsl` |
| Materials | `src/3d/materials/` | `GlassMaterial.ts`, `GradientMaterial.ts` |
| Animations | `src/3d/animations/` | `useFloat.ts`, `useOrbit.ts`, `usePulse.ts` |

---

## 14. System Contracts Summary

| System | Input | Output | Owns |
|--------|-------|--------|------|
| Camera | scroll, mouse, mode | Camera transform | Camera object |
| Lighting | preset, theme | Light objects | Light setup |
| Environment | scene config | Env map, fog | Scene atmosphere |
| Particles | preset, tier | Points object | Particle geometry/material |
| Background | theme, scroll | Background mesh | Background layer |
| Effects | preset, tier | Effect composer | Post-processing |
| Models | key, tier | Model instance | Model cache |
| Mouse | pointer events | NDC, smoothed pos | Input state |
| Scroll | DOM scroll | progress, velocity | Scroll state |

---

## 15. Rules Summary

1. **One system per concern.** No system does another's job.
2. **Systems communicate via shared state**, never direct calls.
3. **Everything is tier-gated.** Performance is a first-class architecture concern.
4. **Everything has a fallback.** No visitor is blocked by 3D.
5. **Shaders do the heavy lifting.** CPU stays out of the render loop.
6. **Scroll is the master clock.** 3D follows the page, never hijacks it.
7. **Models are assets, not code.** Loaded, cached, compressed.
8. **One frame budget, shared fairly.** No system monopolizes.
9. **Declarative composition.** Scenes are JSX; logic is in hooks.
10. **`prefers-reduced-motion` is sacred.** Respect it everywhere.

---

_This architecture is the blueprint for the entire 3D layer. Every component in the [`component-inventory.md`](./component-inventory.md) 3D section traces back to a system defined here. Implementation follows this plan — not the other way around._
