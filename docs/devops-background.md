# Animated DevOps Background — Design

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Elegant · Slow · Ethereal · Glassmorphism-compatible
> **Scope:** Design only. No code.

---

## 0. Concept Summary

A **slowly rotating constellation of DevOps icons** floating in 3D space — Docker whales, AWS hexagons, GitHub cats, CI/CD pipelines, Linux penguins, network nodes, cloud shapes, TrueNAS disks, Git branches, and containers — all drifting in a calm, orbital dance behind the content.

The icons are **not loud logos**. They are **etched glass medallions** — translucent, softly glowing, catching light like frosted crystal. They rotate individually and orbit collectively, creating a living technical atmosphere without distracting from the foreground.

**One-line vision:** *A quiet galaxy of DevOps, orbiting in glass.*

---

## 1. Visual Identity

### 1.1 Treatment
Each icon is rendered as a **glass medallion** — consistent with the Kandarp OS glassmorphism system:

| Property | Value |
|----------|-------|
| Material | Translucent glass (transmission 0.9, roughness 0.1) |
| Edge | Subtle accent-tinted border |
| Fill | Brand icon etched/embossed into the surface |
| Glow | Soft accent halo (bloom picks it up) |
| Opacity | 35–55% (background, never competes with content) |

### 1.2 Why Glass, Not Flat Logos
- Flat colored logos would clash with the minimal, light aesthetic.
- Glass medallions unify disparate brand colors into one cohesive material.
- They catch the scene lighting, adding depth and realism.
- They blur slightly with depth of field, creating atmospheric perspective.

### 1.3 Color Discipline
- **No brand colors.** The Docker whale isn't blue, the GitHub cat isn't black.
- All icons are **monochrome glass** — they inherit the scene's accent tint.
- Brand recognition comes from **silhouette**, not color.
- This keeps the palette pure: light canvas + gradient accent only.

---

## 2. Icon Catalog

### 2.1 The Constellation (10 icon families)

| # | Icon | Silhouette | Count | Significance |
|---|------|-----------|-------|--------------|
| 1 | **Docker** | Whale | 3 | Containerization |
| 2 | **AWS** | Hexagon (or cube) | 4 | Cloud infrastructure |
| 3 | **GitHub** | Cat-in-circle (Octocat mark) | 3 | Source control host |
| 4 | **CI/CD** | Circular pipeline arrows | 4 | Automation |
| 5 | **Linux** | Penguin (Tux) | 2 | Operating system |
| 6 | **Networking** | Connected nodes (graph) | 5 | Connectivity |
| 7 | **Cloud** | Cloud silhouette | 4 | Cloud computing |
| 8 | **TrueNAS** | Disk / storage stack | 2 | Storage / NAS |
| 9 | **Git** | Branch (3-node graph) | 3 | Version control |
| 10 | **Containers** | Stacked box / shipping container | 3 | Container runtime |

**Total medallions:** ~33 floating objects.

### 2.2 Icon Sourcing
- **Silhouettes** derived from official brand marks, simplified to single-color paths.
- **Geometry:** Each icon is extruded as a **low-poly 3D shape** (depth ~0.2 units) — not flat sprites.
- **Format:** GLB models (Draco-compressed) OR extruded SVG paths via `THREE.ExtrudeGeometry`.
- **Consistency:** All icons share the same extrusion depth, bevel, and material.

---

## 3. Motion Design

### 3.1 Core Principle
**Everything rotates slowly.** The motion is meditative, not distracting. A viewer should barely notice it's moving — until they look away and back.

### 3.2 Motion Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 3: Galactic Rotation (whole constellation)   │  1 full rotation / 120s
├─────────────────────────────────────────────────────┤
│  Layer 2: Orbital Paths (icons orbit center)        │  1 orbit / 60–90s (varied)
├─────────────────────────────────────────────────────┤
│  Layer 1: Self-Rotation (each icon spins)           │  1 rotation / 30–60s (varied)
├─────────────────────────────────────────────────────┤
│  Layer 0: Float (gentle vertical bob)               │  ±0.3 units / 8s sine
└─────────────────────────────────────────────────────┘
```

### 3.3 Motion Specifications

| Layer | Axis | Speed | Easing | Notes |
|-------|------|-------|--------|-------|
| Galactic | Y (vertical) | 3°/s | Linear | Entire group rotates as one |
| Orbital | Y (around center) | 4–6°/s | Linear | Each icon on its own radius |
| Self-Rotation | Y (local) | 6–12°/s | Linear | Each icon spins independently |
| Float | Y (position) | ±0.3 units | Sine (8s) | Gentle bob, phase-offset per icon |
| Tilt | X/Z (local) | ±5° | Sine (12s) | Subtle wobble |

### 3.4 Speed Philosophy
- **Slow enough to ignore.** A reader focused on content shouldn't be distracted.
- **Fast enough to notice on glance.** A returning visitor sees it's alive.
- **Varied, not synchronized.** Icons rotate at different speeds — no mechanical uniformity.
- **No sudden movements.** All motion is continuous sine/linear — no easing snaps.

---

## 4. Spatial Composition

### 4.1 Layout Strategy

The icons are distributed across **3 depth shells** around the center, creating a spherical constellation:

```
                    ┌─ Shell 3 (far): 12 icons, radius 14, smallest, most blurred
                    │
          ┌─ Shell 2 (mid): 14 icons, radius 10, medium
          │
┌─ Shell 1 (near): 7 icons, radius 6, largest, sharpest
│
● (center: camera focus, no icon here)
```

### 4.2 Shell Configuration

| Shell | Radius | Icon Count | Icon Scale | Opacity | Blur (DOF) | Purpose |
|-------|--------|-----------|------------|---------|------------|---------|
| Near | 6 | 7 | 1.0 | 55% | Sharp | Foreground depth |
| Mid | 10 | 14 | 0.75 | 45% | Slight | Main field |
| Far | 14 | 12 | 0.5 | 35% | Heavy | Atmospheric haze |

### 4.3 Distribution Rules
- **No clustering.** Icons are distributed via **spherical Fibonacci distribution** (even spacing).
- **No overlap from camera POV.** Near-shell icons avoid aligning with mid/far behind them.
- **Hero zone kept clear.** The center 3-unit radius is icon-free — content lives there.
- **Vertical bias.** Slightly more icons in upper hemisphere (where content header sits below).

---

## 5. Lighting & Material

### 5.1 Material Specification (Glass Medallion)

| Property | Value | Rationale |
|----------|-------|-----------|
| Transmission | 0.9 | Strong glass transparency |
| Roughness | 0.08 | Smooth, polished |
| Metalness | 0.0 | Non-metallic (glass) |
| Thickness | 0.5 | Light refraction depth |
| IOR | 1.4 | Glass refraction index |
| Clearcoat | 1.0 | Glossy surface |
| Clearcoat roughness | 0.1 | Slight imperfection |
| Color | `#FFFFFF` | Neutral (inherits env) |
| Emissive | accent at 5% | Subtle self-glow |

### 5.2 Lighting Interaction
- Icons use the **LightingRig** from the Three.js architecture (key + fill + rim + accent).
- The **rim light** (violet) creates edge highlights on the glass — the signature look.
- The **accent point light** adds a colored glow that bloom amplifies.
- **Environment map** (studio HDR) provides realistic reflections in the glass.

### 5.3 Depth of Field
- **Focus point:** Center of scene (where content overlays).
- **Near icons:** Slightly soft (foreground bokeh).
- **Far icons:** Heavily blurred (atmospheric haze).
- **Result:** Content stays sharp; icons recede into dreamy depth.

---

## 6. Interaction

### 6.1 Mouse Parallax
- The entire constellation shifts ±0.5 units based on mouse position (via Mouse Interaction System).
- Creates a sense of **peeking around** the galaxy.
- Smoothed (damp 0.08) — no jitter.

### 6.2 Scroll Response
- As the user scrolls, the constellation **slowly rotates faster** (galactic rotation speeds up 2×).
- Far shell icons **fade out** as user scrolls past hero (opacity → 0 by 50% scroll).
- Near shell icons **drift upward** and exit (parallax with scroll).

### 6.3 Hover (Desktop Only)
- Hovering near an icon (raycast) makes it **brighten** (emissive +20%) and **slow its rotation**.
- A subtle **tooltip** with the icon name appears (DOM overlay, not 3D text).
- Cursor changes to `pointer`.
- **No click action** — these are ambient, not interactive navigation.

### 6.4 Reduced Motion
- All rotation stops. Icons hold their positions as a **static composition**.
- Mouse parallax disabled.
- The scene becomes a **frozen glass constellation** — still beautiful, zero motion.

---

## 7. Performance

### 7.1 Tier Scaling

| Tier | Icons | Shells | DOF | Bloom | Notes |
|------|-------|--------|-----|-------|-------|
| High | 33 (all) | 3 | ✅ | ✅ | Full experience |
| Medium | 20 | 2 | ❌ | ✅ | Drop far shell, no DOF |
| Low | 10 | 1 | ❌ | ❌ | Near shell only, static |
| Off | 0 | 0 | — | — | CSS gradient + static image |

### 7.2 Optimization Techniques

| Technique | Application |
|-----------|------------|
| Instancing | Same-icon medallions share geometry (e.g., 4 AWS hexagons = 1 geometry, 4 instances) |
| LOD | Near shell = high-poly; far shell = low-poly (or billboards) |
| Frustum culling | Off-screen icons skip rendering |
| Material sharing | All medallions share ONE material instance |
| Geometry merging | Per-shell geometry merge where possible |
| Pixel ratio cap | `Math.min(devicePixelRatio, 2)` |

### 7.3 Frame Budget
- Target: **< 2ms per frame** for the entire background.
- Achieved via: instancing + shared material + GPU rotation (shader) + no per-icon JS.

---

## 8. Fallback

### 8.1 Fallback Chain

```
Full 3D constellation (R3F)
    │ no WebGL / low tier
    ▼
Static rendered image (pre-rendered constellation PNG/WebP)
    │ reduced motion
    ▼
CSS gradient + faint static icon pattern (SVG, 5% opacity)
```

### 8.2 Static Image Spec
- **Pre-rendered** at build time (or authored) — a single high-quality frame of the constellation.
- **Format:** AVIF (primary), WebP (fallback).
- **Size:** < 300 KB.
- **Position:** Fixed, full-viewport, behind content.
- **Opacity:** 40% — present but recessed.

### 8.3 CSS Pattern Fallback
- A subtle **SVG pattern** of icon silhouettes at 5% opacity, tiled.
- No animation. Pure atmosphere.
- Ensures the DevOps theme is hinted even on the weakest devices.

---

## 9. Integration with Existing Systems

| System | Integration |
|--------|-------------|
| **Background System** | This IS the background layer for the hero/DevOps section |
| **Camera System** | Uses `hero-wide` preset; mouse parallax enabled |
| **Lighting System** | Standard `studio` or `dramatic` preset |
| **Environment System** | `studio.hdr` for glass reflections |
| **Effects System** | `cinematic` preset (bloom + DOF + vignette) |
| **Particles System** | `dust` preset layered between icons for atmosphere |
| **Mouse Interaction** | Parallax + hover brightening |
| **Scroll Interaction** | Rotation speed-up + fade-out on scroll |
| **Performance Gate** | Tier-scales icon count and effects |
| **Models System** | Icons loaded as GLB or generated via ExtrudeGeometry |

---

## 10. Section Placement

The DevOps background is **section-scoped**, not site-wide:

| Section | Background | Rationale |
|---------|-----------|-----------|
| Hero | DevOps constellation | Sets the technical tone immediately |
| About | DevOps constellation (faded) | Continuity, lower opacity |
| Projects | Gradient background | Let project content shine |
| Skills | DevOps constellation (returning) | Reinforces technical identity |
| Experience | Gradient background | Focus on timeline |
| Contact | Gradient + subtle particles | Calm closing |

### Transition Behavior
- When entering a DevOps-background section: constellation **fades in** over 800ms.
- When leaving: constellation **fades out** over 600ms.
- Cross-section: the constellation's **galactic rotation continues** (doesn't reset) — feels persistent.

---

## 11. Elegance Checklist

The design is elegant if it passes these checks:

- [ ] A reader can focus on content without noticing the motion.
- [ ] A returning visitor immediately senses the page is "alive."
- [ ] No brand color clashes with the light canvas.
- [ ] Icons read as glass objects, not as advertisements.
- [ ] Depth of field creates atmosphere, not confusion.
- [ ] Motion is continuous — no jumps, no snaps, no loops that "reset."
- [ ] On mobile, it degrades to a beautiful static image.
- [ ] With reduced motion, it's a frozen photograph — still stunning.
- [ ] The total frame cost is invisible to the rest of the page.
- [ ] It feels like a **place**, not a **decoration**.

---

## 12. Mood Reference

> *Imagine looking up at a planetarium — but instead of stars, you see the tools of your craft, etched in frosted glass, drifting in slow orbit. Calm. Technical. Alive. That is the DevOps background of Kandarp OS.*

---

## 13. Design Rules Summary

1. **Glass, not logos.** Monochrome medallions, silhouette-only recognition.
2. **Slow, varied rotation.** Galactic + orbital + self + float, all at different speeds.
3. **3 depth shells.** Near (sharp) → far (blurred) for atmospheric perspective.
4. **Content zone clear.** Center 3 units is icon-free.
5. **Mouse parallax, scroll response.** Alive to input, never hijacking.
6. **Tier-gated.** 33 → 20 → 10 → 0 icons by device capability.
7. **Fallback is beautiful.** Static image, then CSS pattern — never a blank box.
8. **Section-scoped.** Hero + About + Skills; absent elsewhere.
9. **One shared material.** All medallions identical glass — only geometry differs.
10. **Reduced motion = frozen photograph.** Still elegant, zero movement.

---

_This design defines the signature ambient experience of Kandarp OS. It is the first thing a visitor feels — a quiet galaxy of DevOps, orbiting in glass._
