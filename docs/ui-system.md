# UI System — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light Theme · Minimal · Apple · Linear · Stripe

---

## 0. Design DNA

Kandarp OS UI is a synthesis of three reference aesthetics, unified by glassmorphism and restraint:

| Reference | What We Borrow |
|-----------|----------------|
| **Apple** | Generous whitespace, refined typography, tactile depth, calm hierarchy |
| **Linear** | Precise borders, subtle gradients, crisp micro-interactions, restrained color |
| **Stripe** | Professional polish, gradient accents, layered shadows, impeccable inputs |

**The unifying principle:** *Clarity through layering.* Surfaces float on frosted glass. Depth is communicated by blur, border, and shadow — never by heavy color. The interface feels weightless, precise, and premium.

### Design Tenets
1. **Glass first.** Every elevated surface is translucent + blurred, not opaque.
2. **Light by default.** The canvas is luminous; depth comes from layered translucency.
3. **Minimal to the bone.** Remove until it breaks, then add back only what's essential.
4. **Precision over decoration.** 1px borders, exact radii, intentional shadows.
5. **Motion is physics.** Everything moves as if it has mass and momentum.

---

## 1. Colors

### 1.1 Philosophy
A **near-white canvas** with a single **gradient accent**. Color is scarce — it earns its place. The Stripe/Linear influence means color is used for *signal*, not *decoration*.

### 1.2 Canvas (Light Theme)

| Token | Value | Usage |
|-------|-------|-------|
| `--canvas-base` | `#FBFBFD` | Page background (Apple's signature off-white) |
| `--canvas-elevated` | `#FFFFFF` | Raised surfaces, modals |
| `--canvas-sunken` | `#F5F5F7` | Recessed areas, code blocks |
| `--canvas-tint` | `#EEF0F4` | Section dividers |

### 1.3 Text

| Token | Value | Contrast vs Canvas | Usage |
|-------|-------|--------------------|-------|
| `--text-primary` | `#1D1D1F` | 15.8:1 | Headings, body |
| `--text-secondary` | `#424245` | 11.2:1 | Subdued body |
| `--text-tertiary` | `#6E6E73` | 6.4:1 | Captions, meta |
| `--text-quaternary` | `#86868B` | 4.6:1 | Placeholders, disabled |
| `--text-inverse` | `#FBFBFD` | — | Text on accent/dark |

### 1.4 Accent (Gradient System)

The signature accent is a **gradient**, not a flat color — the Stripe/Linear hallmark. Used for primary actions, focus rings, and signature highlights.

| Token | Value |
|-------|-------|
| `--accent-from` | `#6366F1` (indigo) |
| `--accent-via` | `#8B5CF6` (violet) |
| `--accent-to` | `#EC4899` (pink) |
| `--accent-solid` | `#6366F1` (fallback flat) |
| `--accent-hover` | `#4F46E5` |
| `--accent-subtle` | `#EEF0FF` (tint backgrounds) |
| `--accent-gradient` | `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)` |

### 1.5 Glass Surfaces (Glassmorphism Core)

The heart of the system. Translucent layers with backdrop blur.

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `rgba(255, 255, 255, 0.65)` | Standard glass card |
| `--glass-bg-strong` | `rgba(255, 255, 255, 0.80)` | Modals, dropdowns |
| `--glass-bg-subtle` | `rgba(255, 255, 255, 0.45)` | Background panels |
| `--glass-blur` | `16px` | Standard blur |
| `--glass-blur-strong` | `24px` | Modals |
| `--glass-blur-subtle` | `8px` | Light panels |
| `--glass-saturation` | `180%` | Color boost on blur |

### 1.6 Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#10B981` | Success states |
| `--success-subtle` | `#ECFDF5` | Success backgrounds |
| `--warning` | `#F59E0B` | Warning states |
| `--warning-subtle` | `#FFFBEB` | Warning backgrounds |
| `--error` | `#EF4444` | Error states |
| `--error-subtle` | `#FEF2F2` | Error backgrounds |
| `--info` | `#3B82F6` | Info states |
| `--info-subtle` | `#EFF6FF` | Info backgrounds |

### 1.7 Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(0, 0, 0, 0.06)` | Hairline dividers |
| `--border-default` | `rgba(0, 0, 0, 0.10)` | Standard borders |
| `--border-strong` | `rgba(0, 0, 0, 0.16)` | Emphasized borders |
| `--border-glass` | `rgba(255, 255, 255, 0.50)` | Glass edge highlight (top/left) |
| `--border-glass-shadow` | `rgba(0, 0, 0, 0.04)` | Glass edge shadow (bottom/right) |
| `--border-focus` | `#6366F1` | Focus ring |
| `--border-accent` | `rgba(99, 102, 241, 0.40)` | Accent-tinted border |

### 1.8 Overlay & Scrim

| Token | Value | Usage |
|-------|-------|-------|
| `--scrim` | `rgba(15, 15, 20, 0.40)` | Modal backdrop |
| `--scrim-blur` | `8px` | Scrim blur |
| `--overlay-hover` | `rgba(0, 0, 0, 0.03)` | Hover wash |
| `--overlay-active` | `rgba(0, 0, 0, 0.06)` | Pressed wash |

### 1.9 Color Usage Rules
- **Accent is precious.** Max one gradient accent per viewport section.
- **Glass over color.** When a glass surface sits over a colored area, the blur picks up the color naturally.
- **Never use pure black** (`#000`) for text or borders — always `#1D1D1F` or rgba-based.
- **Semantic colors are flat**, never gradient. Only the brand accent is gradient.

---

## 2. Typography

### 2.1 Philosophy
Apple-inspired: a single, neutral, geometric sans with optical sizing. Type does the heavy lifting of hierarchy — not color, not boxes.

### 2.2 Typeface

| Role | Typeface | Fallback | Loading |
|------|----------|----------|---------|
| Display + Body | **Inter** (or SF Pro Display if available) | `-apple-system, system-ui, sans-serif` | `next/font`, subset Latin |
| Mono / Code | **JetBrains Mono** | `ui-monospace, monospace` | `next/font`, subset Latin |

> Inter is chosen for its open license and SF Pro–like geometry. If the deployment environment guarantees Apple devices, SF Pro is preferred.

### 2.3 Type Scale

Modular ratio **1.250 (Major Third)**. Sizes are fluid — they scale down on mobile via `clamp()`.

| Token | Desktop | Mobile | Line Height | Tracking | Usage |
|-------|---------|--------|-------------|----------|-------|
| `display-2xl` | `4.5rem` (72px) | `2.75rem` (44px) | 1.05 | -0.04em | Hero headline |
| `display-xl` | `3.75rem` (60px) | `2.5rem` (40px) | 1.05 | -0.035em | Page hero |
| `display-lg` | `3rem` (48px) | `2.25rem` (36px) | 1.10 | -0.03em | Section hero |
| `text-h1` | `2.25rem` (36px) | `1.875rem` (30px) | 1.15 | -0.025em | H1 |
| `text-h2` | `1.875rem` (30px) | `1.5rem` (24px) | 1.20 | -0.02em | H2 |
| `text-h3` | `1.5rem` (24px) | `1.25rem` (20px) | 1.25 | -0.015em | H3 |
| `text-h4` | `1.25rem` (20px) | `1.125rem` (18px) | 1.30 | -0.01em | H4 |
| `text-lg` | `1.125rem` (18px) | `1.0625rem` (17px) | 1.50 | 0 | Lead paragraph |
| `text-base` | `1rem` (16px) | `1rem` (16px) | 1.60 | 0 | Body |
| `text-sm` | `0.875rem` (14px) | `0.875rem` (14px) | 1.55 | 0 | Secondary text |
| `text-xs` | `0.75rem` (12px) | `0.75rem` (12px) | 1.50 | 0.01em | Labels, captions |
| `text-2xs` | `0.6875rem` (11px) | `0.6875rem` (11px) | 1.45 | 0.05em | Overlines, eyebrows |

### 2.4 Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-regular` | 400 | Body |
| `font-medium` | 500 | Buttons, labels, nav |
| `font-semibold` | 600 | Subheadings, emphasis |
| `font-bold` | 700 | Headings |
| `font-extrabold` | 800 | Display only |

### 2.5 Special Treatments

| Treatment | Spec | Usage |
|-----------|------|-------|
| **Gradient text** | `background: accent-gradient; -webkit-background-clip: text; color: transparent;` | Hero accent words |
| **Eyebrow / overline** | `text-2xs`, `font-semibold`, `tracking-[0.15em]`, `uppercase`, `text-tertiary` | Section labels |
| **Mono label** | `font-mono`, `text-xs`, `text-tertiary` | Code-like metadata |
| **Balance** | `text-wrap: balance` on headings | Prevents orphan words |

### 2.6 Typographic Rules
- **Never justify text.** Always left-aligned (RTL exceptions).
- **Max measure (line length):** 65–75 characters for body text.
- **Paragraph spacing:** `1em` margin-bottom, no first-line indent.
- **No all-caps body text.** Caps only for eyebrows/overlines ≤ 3 words.
- **Numbers in mono** when tabular alignment matters (stats, metrics).

---

## 3. Spacing

### 3.1 Base Unit
**4px (0.25rem).** All spacing is a multiple of 4. This is the Apple/Linear precision standard.

### 3.2 Scale

| Token | rem | px | Usage |
|-------|-----|-----|-------|
| `space-0` | 0 | 0 | — |
| `space-px` | 0.0625 | 1 | Hairline gaps |
| `space-0.5` | 0.125 | 2 | Icon-to-text micro |
| `space-1` | 0.25 | 4 | Tight inline |
| `space-1.5` | 0.375 | 6 | Icon padding |
| `space-2` | 0.5 | 8 | Compact element padding |
| `space-3` | 0.75 | 12 | Default element padding |
| `space-4` | 1 | 16 | Standard gap |
| `space-5` | 1.25 | 20 | Card padding |
| `space-6` | 1.5 | 24 | Section sub-gap |
| `space-8` | 2 | 32 | Section gap |
| `space-10` | 2.5 | 40 | Large gap |
| `space-12` | 3 | 48 | Section vertical |
| `space-16` | 4 | 64 | Major section |
| `space-20` | 5 | 80 | Hero spacing |
| `space-24` | 6 | 96 | Page rhythm |
| `space-32` | 8 | 128 | Hero vertical |

### 3.3 Spacing Rules
- **Vertical rhythm:** sections separated by `space-20` (mobile) → `space-32` (desktop).
- **Component internal padding:** always from the scale, never arbitrary.
- **Tight by default, breathe on intent.** Density for data, space for narrative.

---

## 4. Grid

### 4.1 Container

| Token | Max Width | Padding (mobile) | Padding (desktop) | Usage |
|-------|-----------|------------------|-------------------|-------|
| `container-prose` | 680px | 1rem | 2rem | Articles, long-form |
| `container-default` | 1152px | 1rem | 2rem | Standard pages |
| `container-wide` | 1440px | 1rem | 2rem | Full-bleed sections |
| `container-full` | 100% | 0 | 0 | Edge-to-edge (3D, heroes) |

### 4.2 Breakpoints

Mobile-first. Apple/Stripe-grade precision.

| Name | Min-width | Target |
|------|-----------|--------|
| `xs` | 0 | Mobile portrait |
| `sm` | 640px | Mobile landscape / small tablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### 4.3 Column System

**12-column** grid on `md` and up. Single column on mobile.

| Breakpoint | Columns | Gutter | Margin |
|------------|---------|--------|--------|
| `xs`–`sm` | 4 | 16px | 16px |
| `md` | 8 | 24px | 24px |
| `lg`+ | 12 | 32px | 32px |

### 4.4 Common Layouts

| Pattern | Spec |
|---------|------|
| **Hero** | Full-width, content in `container-default`, vertical center |
| **Feature grid** | 1 col (mobile) → 2 col (md) → 3 col (lg) |
| **Project grid** | 1 col (mobile) → 2 col (md) → 3 col (xl) |
| **Two-column** | 1 col (mobile) → 7/5 split (lg) for content/aside |
| **Centered** | `container-prose`, max 680px, centered |

### 4.5 Grid Rules
- **Content never touches edges** — always container padding.
- **Full-bleed is intentional** — only for heroes, 3D, and dividers.
- **Asymmetry is allowed** — 7/5 and 5/7 splits add Linear-style dynamism.

---

## 5. Buttons

### 5.1 Anatomy
```
┌─────────────────────────────────┐
│  [icon]  Label            [icon]│
└─────────────────────────────────┘
 padding-x: space-4 (16px) / space-5 (20px) for large
 padding-y: space-2 (8px) / space-2.5 (10px) for large
 height: 36px (default) / 44px (large) / 28px (small)
```

### 5.2 Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| **Primary** | `accent-gradient` | `text-inverse` | none | Main CTA |
| **Secondary (Glass)** | `glass-bg` + blur | `text-primary` | `border-default` | Supporting action |
| **Tertiary (Ghost)** | transparent | `text-primary` | none | Tertiary action |
| **Outline** | transparent | `accent-solid` | `border-accent` | Alt primary |
| **Danger** | `#EF4444` | `text-inverse` | none | Destructive |

### 5.3 Sizes

| Size | Height | Padding X | Padding Y | Font | Icon |
|------|--------|----------|-----------|------|------|
| `sm` | 28px | 12px | 4px | `text-xs` | 14px |
| `md` (default) | 36px | 16px | 8px | `text-sm` | 16px |
| `lg` | 44px | 20px | 10px | `text-base` | 18px |
| `xl` | 52px | 28px | 12px | `text-lg` | 20px |

### 5.4 States

| State | Primary | Glass | Ghost |
|-------|---------|-------|-------|
| **Default** | gradient | glass-bg | transparent |
| **Hover** | brightness(1.08) | glass-bg-strong | overlay-hover |
| **Active/Pressed** | brightness(0.95) scale(0.98) | overlay-active | overlay-active |
| **Focus** | 2px ring accent at 30% | same | same |
| **Disabled** | 40% opacity, no pointer | same | same |
| **Loading** | spinner replaces icon, label dims | same | same |

### 5.5 Button Rules
- **One primary per section.** Hierarchy is sacred.
- **Icon + label** reads left-to-right; icon-only buttons need `aria-label`.
- **Loading state never shifts layout** — spinner occupies icon's space.
- **Touch targets ≥ 44px** on mobile (use `lg` size or pad the hit area).
- **Gradient buttons get a subtle inner highlight** (top border `rgba(255,255,255,0.2)`).

---

## 6. Cards

### 6.1 The Glass Card (Signature Component)

The defining element of the system.

```
┌─────────────────────────────────────┐  ← border-glass (top, rgba(255,255,255,0.5))
│                                     │
│         [content area]              │  ← glass-bg (rgba(255,255,255,0.65))
│                                     │     backdrop-blur: 16px
│                                     │     saturate: 180%
└─────────────────────────────────────┘  ← border-glass-shadow (bottom, rgba(0,0,0,0.04))
```

### 6.2 Card Variants

| Variant | Background | Border | Shadow | Blur | Usage |
|---------|-----------|--------|--------|------|-------|
| **Glass** (default) | `glass-bg` | `border-default` + glass edge | `shadow-glass` | 16px | Standard card |
| **Glass Strong** | `glass-bg-strong` | `border-default` | `shadow-md` | 24px | Modals, popovers |
| **Solid** | `canvas-elevated` | `border-subtle` | `shadow-sm` | none | Data-dense cards |
| **Outline** | transparent | `border-default` | none | none | Inline grouping |
| **Gradient Border** | `glass-bg` | gradient 1px | `shadow-glass` | 16px | Featured/hover |

### 6.3 Card Anatomy

| Region | Padding | Notes |
|--------|---------|-------|
| **Padding (default)** | `space-5` (20px) | All sides |
| **Padding (compact)** | `space-4` (16px) | Dense layouts |
| **Padding (comfortable)** | `space-6` (24px) | Feature cards |
| **Header** | `space-5` bottom border `border-subtle` | Optional |
| **Footer** | `space-5` top border `border-subtle` | Optional |
| **Media** | full-bleed top, radius top only | Aspect ratio enforced |

### 6.4 Card Radius

| Size | Value | Usage |
|------|-------|-------|
| `card-radius-sm` | 12px | Compact cards |
| `card-radius-md` (default) | 16px | Standard |
| `card-radius-lg` | 20px | Feature cards |
| `card-radius-xl` | 24px | Modals |

### 6.5 Card Hover (Interactive)

| Property | Default | Hover |
|----------|---------|-------|
| `transform` | none | `translateY(-4px)` |
| `shadow` | `shadow-glass` | `shadow-glass-hover` |
| `border` | `border-default` | `border-accent` |
| `transition` | — | `250ms ease-out` |

### 6.6 Card Rules
- **Glass cards need something behind them** to blur. Don't place on flat white — use a gradient/texture backdrop.
- **Never nest glass in glass** — it muddies. Use solid cards inside glass.
- **One radius per card** — media inherits the card's top radius.
- **Hover lift is subtle** — 4px max. Apple restraint, not Linear bounce.

---

## 7. Inputs

### 7.1 Anatomy (Stripe-grade precision)

```
  Label (text-sm, font-medium, text-primary)
  ┌─────────────────────────────────────────┐
  │  [icon]  Placeholder / value       [affix]│  ← height 44px (touch)
  └─────────────────────────────────────────┘
  Helper text (text-xs, text-tertiary)  /  Error (text-xs, text-error)
```

### 7.2 Input Variants

| Variant | Background | Border | Usage |
|---------|-----------|--------|-------|
| **Glass** (default) | `glass-bg-subtle` | `border-default` | Standard forms |
| **Solid** | `canvas-elevated` | `border-default` | Dense/data forms |
| **Flush** | transparent | bottom border only | Search, inline edit |

### 7.3 Sizes

| Size | Height | Padding X | Padding Y | Font |
|------|--------|----------|-----------|------|
| `sm` | 32px | 12px | 6px | `text-sm` |
| `md` (default) | 40px | 14px | 8px | `text-sm` |
| `lg` | 48px | 16px | 12px | `text-base` |

### 7.4 States

| State | Border | Background | Shadow | Notes |
|-------|--------|------------|--------|-------|
| **Default** | `border-default` | `glass-bg-subtle` | none | — |
| **Hover** | `border-strong` | `glass-bg` | none | — |
| **Focus** | `border-focus` | `canvas-elevated` | `0 0 0 3px rgba(99,102,241,0.15)` | Ring, not outline |
| **Error** | `#EF4444` | `error-subtle` | `0 0 0 3px rgba(239,68,68,0.15)` | — |
| **Success** | `#10B981` | `success-subtle` | none | After validation |
| **Disabled** | `border-subtle` | `canvas-sunken` | none | 50% opacity text |

### 7.5 Input Elements

| Element | Spec |
|---------|------|
| **Label** | `text-sm`, `font-medium`, `text-primary`, `space-2` below input |
| **Helper text** | `text-xs`, `text-tertiary`, `space-1.5` below input |
| **Error text** | `text-xs`, `text-error`, `space-1.5` below input |
| **Placeholder** | `text-quaternary` |
| **Leading icon** | 18px, `text-tertiary`, left padding `space-10` on input |
| **Trailing affix** | `text-xs`, `text-tertiary`, e.g., "0/280" |
| **Prefix/suffix** | `glass-bg`, `text-tertiary`, inset border |

### 7.6 Special Inputs

| Input | Spec |
|-------|------|
| **Search** | Leading magnifier icon, clear button (X) on value, `flush` variant in nav |
| **Textarea** | Min-height 96px, resize vertical only, same states |
| **Select** | Custom trigger (glass button), chevron icon, glass dropdown panel |
| **Checkbox** | 18px, `radius-sm`, accent fill when checked, custom check icon |
| **Radio** | 18px, accent ring when selected |
| **Toggle** | 44×24px track, 20px knob, smooth slide, accent when on |
| **Slider** | 4px track, 16px knob, accent fill to value |

### 7.7 Input Rules
- **Always have a label** — placeholder is not a label.
- **Focus ring is mandatory** — never `outline: none` without replacement.
- **Validation is inline** — show error on blur, clear on input.
- **Touch inputs are 44px min** — no exceptions on mobile.
- **Autofill** must be styled to match (override yellow autofill background).

---

## 8. Borders

### 8.1 Philosophy
Linear-grade precision. Borders are **1px hairlines** that define edges without weighing down the interface. Glass edges get a dual treatment: light on top, shadow on bottom.

### 8.2 Border Scale

| Token | Width | Usage |
|-------|-------|-------|
| `border-hairline` | 0.5px | Retina hairlines (use `1px` for cross-browser) |
| `border-thin` | 1px | Standard (default) |
| `border-thick` | 2px | Emphasis, focus |
| `border-heavy` | 4px | Rare, decorative only |

### 8.3 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0 | Images flush |
| `radius-xs` | 4px | Badges, chips |
| `radius-sm` | 6px | Small inputs, checkboxes |
| `radius-md` | 8px | Buttons, inputs (default) |
| `radius-lg` | 12px | Small cards |
| `radius-xl` | 16px | Standard cards |
| `radius-2xl` | 20px | Feature cards |
| `radius-3xl` | 24px | Modals, large cards |
| `radius-full` | 9999px | Pills, avatars, toggles |

### 8.4 Glass Edge Treatment (Signature)

Every glass surface gets a **dual border** to simulate frosted glass catching light:

```css
border: 1px solid rgba(0, 0, 0, 0.10);              /* base edge */
box-shadow:
  inset 0 1px 0 0 rgba(255, 255, 255, 0.50),       /* top light edge */
  inset 0 -1px 0 0 rgba(0, 0, 0, 0.04),            /* bottom shadow edge */
  0 4px 16px rgba(0, 0, 0, 0.06);                  /* drop shadow */
```

### 8.5 Border Rules
- **1px is the default.** Thicker borders are intentional and rare.
- **Glass always gets the inset highlight** — it's what makes glass look like glass.
- **Borders use rgba, not hex** — they blend with the surface beneath.
- **Focus borders are 2px + ring** — never just a color change.
- **Dividers are borders, not background colors** — use `border-subtle`.

---

## 9. Shadows

### 9.1 Philosophy
Shadows are **layered and soft** — the Stripe signature. Never a single harsh drop shadow. Each shadow is a stack of 2–3 to simulate natural light.

### 9.2 Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | none | Flat elements |
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle elevation |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Inputs, chips |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)` | Dropdowns |
| `shadow-lg` | `0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)` | Popovers |
| `shadow-xl` | `0 24px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.04)` | Modals |
| `shadow-2xl` | `0 32px 64px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.06)` | Hero elements |

### 9.3 Glass Shadows (Special)

Glass surfaces use shadows that complement the blur — softer, wider, lower-opacity.

| Token | Value |
|-------|-------|
| `shadow-glass` | `0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| `shadow-glass-hover` | `0 12px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)` |
| `shadow-glass-modal` | `0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)` |

### 9.4 Accent Glow (Linear-style)

For primary CTAs and focus states — a colored glow, not a shadow.

| Token | Value |
|-------|-------|
| `glow-accent-sm` | `0 0 20px rgba(99,102,241,0.25)` |
| `glow-accent-md` | `0 0 40px rgba(99,102,241,0.30)` |
| `glow-accent-lg` | `0 0 80px rgba(99,102,241,0.35)` |

### 9.5 Shadow Rules
- **Layered, never single.** Every shadow is a stack of 2+.
- **Opacity ≤ 12%.** Shadows suggest depth, they don't shout.
- **Glass uses glass shadows.** Don't mix solid shadows on glass surfaces.
- **Glow is for accent only.** Never use colored glow on neutral elements.
- **Hover increases shadow** — elevation communicates interactivity.

---

## 10. Animation Rules

### 10.1 Philosophy
Motion is **physical and purposeful** — Apple's spring physics meet Linear's precision. Nothing animates without a reason. Everything that moves has mass.

### 10.2 Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `duration-instant` | 0ms | No motion |
| `duration-fast` | 120ms | Hover, focus, color |
| `duration-normal` | 200ms | Standard transitions |
| `duration-slow` | 320ms | Layout shifts, reveals |
| `duration-slower` | 480ms | Page transitions |
| `duration-cinematic` | 640ms | Hero reveals, 3D |

### 10.3 Easing Curves

| Token | Cubic-Bezier | Character | Usage |
|-------|--------------|-----------|-------|
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Balanced | Default |
| `ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerate | Elements appearing |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate | Elements leaving |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot | Playful, tactile |
| `ease-smooth` | `cubic-bezier(0.45, 0, 0.15, 1)` | Silk | Apple-style smooth |

### 10.4 Motion Patterns

| Pattern | Spec | Usage |
|---------|------|-------|
| **Fade in** | opacity 0→1, `duration-normal`, `ease-enter` | Content reveal |
| **Fade up** | opacity + translateY(8px→0), `duration-slow`, `ease-enter` | Section reveal |
| **Scale in** | scale(0.96→1) + opacity, `duration-normal`, `ease-spring` | Modals, popovers |
| **Slide in** | translateX/Y, `duration-slow`, `ease-smooth` | Drawers, toasts |
| **Hover lift** | translateY(0→-4px), `duration-fast`, `ease-standard` | Cards |
| **Press** | scale(1→0.98), `duration-instant` | Buttons |
| **Stagger** | each child +50ms delay | List reveals |

### 10.5 Spring Physics (Framer Motion)

For interactive, physics-based motion:

| Spring | Stiffness | Damping | Mass | Usage |
|--------|-----------|---------|------|-------|
| `spring-snappy` | 500 | 30 | 1 | Buttons, toggles |
| `spring-smooth` | 300 | 26 | 1 | Cards, drag |
| `spring-soft` | 200 | 22 | 1 | Modals, large elements |
| `spring-bouncy` | 400 | 15 | 1 | Playful micro-interactions |

### 10.6 Scroll-Driven Motion
- **Reveal on enter:** elements fade-up when scrolled into view (once).
- **Parallax:** background layers move at 0.5×–0.8× scroll speed (subtle).
- **Scroll progress:** a thin gradient bar at top tracks page scroll.
- **Sticky shrink:** header shrinks (height + padding) after 80px scroll.

### 10.7 Accessibility (Motion)
- **`prefers-reduced-motion: reduce`** → disable all non-essential motion.
  - No parallax, no scroll-driven reveals, no spring physics.
  - Instant transitions only (`duration-instant`).
  - Content appears immediately, no fade.
- **Never auto-play motion** that lasts > 5s without user interaction.
- **Motion never blocks interaction** — elements are clickable during animation.

### 10.8 Animation Rules
- **One motion at a time per element.** Don't combine scale + rotate + translate casually.
- **Easing is never linear** except for progress bars and spinners.
- **Hover transitions ≤ 150ms.** Anything slower feels sluggish.
- **Exit animations are faster than enter** (exit 150ms, enter 250ms).
- **3D motion is exempt** from UI duration scale — it follows scene physics.

---

## 11. Responsive Rules

### 11.1 Philosophy
**Mobile-first, desktop-refined.** The mobile experience is not a downgrade — it's a first-class citizen. Apple-grade fluidity across breakpoints.

### 11.2 Breakpoint Behavior

| Element | Mobile (`<md`) | Tablet (`md`–`lg`) | Desktop (`lg`+) |
|---------|----------------|--------------------|-----------------|
| **Navigation** | Bottom sheet / hamburger | Collapsed nav | Full nav |
| **Hero** | Stacked, centered | Stacked, left | Side-by-side |
| **Cards** | 1 column | 2 columns | 3 columns |
| **Typography** | Scaled down (clamp) | Mid | Full scale |
| **Spacing** | Tighter (space-4 gaps) | Medium | Full (space-8+) |
| **Shadows** | Reduced (mobile screens are small) | Standard | Standard + glow |
| **Glass blur** | 8px (perf) | 12px | 16px+ |
| **3D** | Disabled or static fallback | Static or low-poly | Full 3D |

### 11.3 Fluid Typography

All headings use `clamp()` for smooth scaling:

```css
--display-2xl: clamp(2.75rem, 5vw + 1rem, 4.5rem);
--display-xl:  clamp(2.5rem, 4vw + 1rem, 3.75rem);
--text-h1:     clamp(1.875rem, 3vw + 0.5rem, 2.25rem);
```

### 11.4 Touch Rules
- **Minimum touch target: 44×44px.** (Apple HIG)
- **Spacing between touch targets: ≥ 8px.**
- **No hover-dependent interactions** on touch — hover is enhancement, not requirement.
- **Disable custom cursors** on touch devices.
- **Forms use appropriate input types** (`email`, `tel`, `number`) for native keyboards.

### 11.5 Performance by Device

| Capability | Mobile | Desktop |
|------------|--------|---------|
| **Backdrop blur** | 8px max (or disable on low-end) | 16–24px |
| **3D scenes** | Static image fallback or low-poly | Full R3F |
| **Animations** | Reduced (respect reduced-motion) | Full |
| **Images** | AVIF, smaller sizes via `next/image` | AVIF, full size |
| **Parallax** | Disabled | Enabled |

### 11.6 Responsive Rules
- **Design at 375px first** (iPhone SE), then scale up.
- **Test at 320px** (smallest) and 2560px (largest).
- **No horizontal scroll** at any breakpoint — overflow scrolls internally.
- **Tables collapse to cards** on mobile.
- **Modals become bottom sheets** on mobile (slide from bottom, not center).
- **Dropdowns become full-screen selects** on mobile.

---

## 12. Component Composition Preview (Conceptual)

> Not implementation — just how the tokens combine.

### 12.1 A Glass Card
```
┌─ border: 1px solid rgba(0,0,0,0.10) ──────────────────────┐
│  inset top: rgba(255,255,255,0.50)                        │
│  background: rgba(255,255,255,0.65)                        │
│  backdrop-filter: blur(16px) saturate(180%)               │
│  box-shadow: 0 4px 16px rgba(0,0,0,0.06)                  │
│  border-radius: 16px                                      │
│  padding: 20px                                             │
│                                                           │
│   [Eyebrow overline]                                      │
│   Heading (text-h3, font-semibold)                        │
│   Body text (text-base, text-secondary)                   │
│                                                           │
│   [Primary Button]  [Ghost Button]                        │
└───────────────────────────────────────────────────────────┘
```

### 12.2 A Primary Button
```
┌─ background: linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899) ─┐
│  color: #FBFBFD                                                  │
│  border: none                                                    │
│  inset top: rgba(255,255,255,0.20)                               │
│  box-shadow: 0 0 20px rgba(99,102,241,0.25)                      │
│  border-radius: 8px                                              │
│  padding: 8px 16px                                               │
│  font: 500 14px Inter                                            │
│  transition: 120ms ease-standard                                 │
│                                                                 │
│   →  Get in touch                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 A Focused Input
```
  Full name
  ┌─ border: 2px solid #6366F1 ────────────────────────────┐
  │  background: #FFFFFF                                    │
  │  box-shadow: 0 0 0 3px rgba(99,102,241,0.15)             │
  │  border-radius: 8px                                     │
  │  height: 40px                                            │
  │                                                         │
  │  👤  Kandarp Khandwala                            0/50  │
  └─────────────────────────────────────────────────────────┘
  Please enter your full name
```

---

## 13. Token Implementation Note

All values defined here are **CSS custom properties** in `src/styles/tokens.css`, mapped to Tailwind utilities in `tailwind.config.ts`. Components consume tokens via utilities — never raw values. See [`design-system.md`](./design-system.md) §14 for the implementation contract.

---

## 14. UI System Rules Summary

1. **Glass is the default elevated surface.** Solid is the exception.
2. **Light canvas, gradient accent.** Color is signal, not decoration.
3. **1px borders, layered shadows.** Precision over weight.
4. **Inter typography, fluid clamp scale.** Hierarchy by size and weight.
5. **4px spacing grid.** No arbitrary values.
6. **Motion is physical.** Springs, not linear; purpose, not decoration.
7. **Mobile-first, 44px touch.** Accessibility is architecture.
8. **Reduce blur and 3D on mobile.** Performance is respect.
9. **One primary action per section.** Hierarchy is sacred.
10. **Tokens, not magic numbers.** If it's not here, it doesn't exist.

---

_This UI system is the visual contract of Kandarp OS. Every component must be traceable to these tokens. When the system evolves, this document evolves first._
