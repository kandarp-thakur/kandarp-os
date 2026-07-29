# Design System — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

---

## 1. Design Philosophy

The Kandarp OS design system is built on three principles:

1. **Token-driven.** Every visual value is a named token. No magic numbers in components.
2. **Theme-aware.** Light and dark are first-class. Tokens swap, components don't.
3. **Calm by default, expressive on intent.** The baseline is restrained and readable. Motion and 3D provide the expression.

---

## 2. Color System

### 2.1 Token Naming Convention

Colors follow a **semantic + scale** convention:

```
--<role>-<state>-<property>-<scale>
```

Examples: `--color-bg-primary`, `--color-text-muted`, `--color-border-subtle`

### 2.2 Primitive Palette

The raw color palette. These are **never used directly** in components — only mapped to semantic tokens.

| Scale | Light | Dark |
|-------|-------|------|
| 50 | `#f8fafc` | `#0a0a0f` |
| 100 | `#f1f5f9` | `#111118` |
| 200 | `#e2e8f0` | `#1a1a24` |
| 300 | `#cbd5e1` | `#2a2a38` |
| 400 | `#94a3b8` | `#4a4a5c` |
| 500 | `#64748b` | `#7a7a8c` |
| 600 | `#475569` | `#9a9aac` |
| 700 | `#334155` | `#bababa` |
| 800 | `#1e293b` | `#dadada` |
| 900 | `#0f172a` | `#f5f5f5` |

### 2.3 Accent (Brand) Color

The signature accent — used sparingly for emphasis and interaction.

| Scale | Value |
|-------|-------|
| 50 | `#eef9ff` |
| 100 | `#d9f0ff` |
| 300 | `#7dd3fc` |
| 500 | `#0ea5e9` (primary) |
| 700 | `#0369a1` |
| 900 | `#0c4a6e` |

### 2.4 Semantic Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `bg-primary` | 50 | 900 | Page background |
| `bg-secondary` | 100 | 800 | Card / section background |
| `bg-elevated` | white | 800 | Modals, dropdowns |
| `text-primary` | 900 | 50 | Headings, body |
| `text-secondary` | 700 | 300 | Subdued text |
| `text-muted` | 500 | 500 | Captions, hints |
| `border-subtle` | 200 | 800 | Default borders |
| `border-strong` | 300 | 700 | Emphasized borders |
| `accent` | 500 | 300 | Links, primary actions |
| `accent-hover` | 700 | 100 | Hover state |
| `success` | `#16a34a` | `#4ade80` | Success states |
| `warning` | `#d97706` | `#fbbf24` | Warning states |
| `error` | `#dc2626` | `#f87171` | Error states |

### 2.5 Contrast Requirements

- **Body text:** minimum **7:1** contrast (AAA).
- **Large text / headings:** minimum **4.5:1** (AA).
- **Interactive elements:** minimum **4.5:1** for both text and icon.

---

## 3. Typography

### 3.1 Typeface Selection

| Role | Typeface | Why |
|------|----------|-----|
| Display / Headings | **Geist Sans** (or Inter) | Modern, geometric, excellent at large sizes |
| Body | **Geist Sans** (or Inter) | Consistent with headings |
| Mono / Code | **Geist Mono** (or JetBrains Mono) | Ligatures, readable at small sizes |

All fonts loaded via `next/font` for zero layout shift.

### 3.2 Type Scale

Modular scale, ratio **1.250 (Major Third)**.

| Token | Size (rem) | Size (px) | Usage |
|-------|-----------|-----------|-------|
| `text-xs` | 0.75 | 12 | Labels, captions |
| `text-sm` | 0.875 | 14 | Secondary text, form hints |
| `text-base` | 1 | 16 | Body text (base) |
| `text-lg` | 1.125 | 18 | Lead paragraphs |
| `text-xl` | 1.25 | 20 | Subheadings |
| `text-2xl` | 1.5 | 24 | H4 |
| `text-3xl` | 1.875 | 30 | H3 |
| `text-4xl` | 2.25 | 36 | H2 |
| `text-5xl` | 3 | 48 | H1 |
| `text-6xl` | 3.75 | 60 | Display |
| `text-7xl` | 4.5 | 72 | Hero display |

### 3.3 Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body |
| `font-medium` | 500 | Buttons, labels |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |
| `font-extrabold` | 800 | Display |

### 3.4 Line Height

| Token | Value | Usage |
|-------|-------|-------|
| `leading-none` | 1 | Display |
| `leading-tight` | 1.15 | Headings |
| `leading-snug` | 1.375 | Subheadings |
| `leading-normal` | 1.5 | Body |
| `leading-relaxed` | 1.625 | Long-form reading |

### 3.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tracking-tighter` | -0.05em | Display |
| `tracking-tight` | -0.025em | Headings |
| `tracking-normal` | 0 | Body |
| `tracking-wide` | 0.025em | Uppercase labels |
| `tracking-wider` | 0.05em | Overlines |

---

## 4. Spacing System

Base unit: **4px (0.25rem)**. All spacing is a multiple of 4.

| Token | rem | px |
|-------|-----|-----|
| `space-0` | 0 | 0 |
| `space-1` | 0.25 | 4 |
| `space-2` | 0.5 | 8 |
| `space-3` | 0.75 | 12 |
| `space-4` | 1 | 16 |
| `space-5` | 1.25 | 20 |
| `space-6` | 1.5 | 24 |
| `space-8` | 2 | 32 |
| `space-10` | 2.5 | 40 |
| `space-12` | 3 | 48 |
| `space-16` | 4 | 64 |
| `space-20` | 5 | 80 |
| `space-24` | 6 | 96 |

**Rule:** Never use raw pixel values. Always reference a spacing token.

---

## 5. Layout & Grid

### 5.1 Container

| Token | Value |
|-------|-------|
| `container-sm` | 640px |
| `container-md` | 768px |
| `container-lg` | 1024px |
| `container-xl` | 1280px |
| `container-2xl` | 1440px (max) |
| `container-padding` | 1rem (mobile) → 2rem (desktop) |

### 5.2 Breakpoints

| Name | Min-width | Usage |
|------|-----------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

**Mobile-first.** All styles default to mobile; `md:` and up override.

### 5.3 Section Rhythm

- Vertical section padding: `space-20` (mobile) → `space-24` (desktop).
- Section gap: consistent `space-12` between major blocks.
- Max content width for reading: `container-md` (768px).

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0 | Images flush to edge |
| `radius-sm` | 4px | Small elements, badges |
| `radius-md` | 8px | Inputs, buttons |
| `radius-lg` | 12px | Cards |
| `radius-xl` | 16px | Modals, large cards |
| `radius-2xl` | 24px | Hero elements |
| `radius-full` | 9999px | Pills, avatars |

---

## 7. Shadows

Shadows are subtle in light mode, glow-based in dark mode.

### 7.1 Light Mode

| Token | Value |
|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` |

### 7.2 Dark Mode (Glow)

| Token | Value |
|-------|-------|
| `glow-sm` | `0 0 20px rgba(14,165,233,0.15)` |
| `glow-md` | `0 0 40px rgba(14,165,233,0.2)` |
| `glow-lg` | `0 0 80px rgba(14,165,233,0.25)` |

---

## 8. Motion

### 8.1 Duration

| Token | ms | Usage |
|-------|----|-------|
| `duration-instant` | 0 | No animation |
| `duration-fast` | 150 | Hover, focus |
| `duration-normal` | 250 | Standard transitions |
| `duration-slow` | 400 | Page transitions |
| `duration-slower` | 600 | Large scene reveals |

### 8.2 Easing

| Token | Cubic-bezier | Usage |
|-------|-------------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Bidirectional |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot |

### 8.3 Motion Principles

- **Motion communicates cause and effect.** Never decorative-only.
- **Respect `prefers-reduced-motion`.** Disable non-essential animation.
- **Duration scales with distance.** Small movements = fast; large = slow.
- **Never block interaction.** Animations must not delay user input.

---

## 9. Z-Index Scale

| Token | Value | Layer |
|-------|-------|-------|
| `z-base` | 0 | Default content |
| `z-dropdown` | 1000 | Dropdowns, popovers |
| `z-sticky` | 1100 | Sticky headers |
| `z-overlay` | 1200 | Modals, drawers |
| `z-toast` | 1300 | Toasts |
| `z-tooltip` | 1400 | Tooltips |

---

## 10. Component Visual Rules

### 10.1 Buttons

| Variant | Padding | Radius | Font |
|---------|--------|--------|------|
| Primary | `space-2 space-4` | `radius-md` | `font-medium text-sm` |
| Secondary | `space-2 space-4` | `radius-md` | `font-medium text-sm` |
| Ghost | `space-2 space-4` | `radius-md` | `font-medium text-sm` |
| Icon | `space-2` | `radius-md` | — |

- Focus ring: `2px` accent color, `2px` offset.
- Disabled: 50% opacity, `cursor-not-allowed`.

### 10.2 Cards

- Background: `bg-secondary`
- Border: `1px solid border-subtle`
- Radius: `radius-lg`
- Padding: `space-6`
- Hover: lift via `shadow-lg` + `translateY(-2px)`

### 10.3 Inputs

- Height: `40px` (mobile) / `36px` (desktop)
- Border: `1px solid border-subtle`
- Radius: `radius-md`
- Focus: border → accent, ring → `0 0 0 3px` accent at 20% opacity
- Error: border → error color

---

## 11. Iconography

- **Library:** Lucide React.
- **Size:** 16px (inline), 20px (UI), 24px (feature), 32px (hero).
- **Stroke width:** 1.5px (default), 2px (emphasis).
- **Color:** inherits `currentColor`.

---

## 12. Imagery

- **Format:** AVIF (primary), WebP (fallback).
- **Aspect ratios:** standardized per component (e.g., project cards = 16:9).
- **Loading:** `next/image` with `lazy` by default, `priority` for LCP.
- **Placeholder:** blur placeholder for above-the-fold images.

---

## 13. Dark Mode

- Default theme: **dark** (matches the "OS" aesthetic).
- Toggle: persisted in `localStorage`, respects `prefers-color-scheme` on first visit.
- No flash of incorrect theme (FOUC) — handled via a blocking script in `<head>`.
- All tokens swap; **no component-level dark: overrides** unless absolutely necessary.

---

## 14. Token Implementation

Tokens are defined in **two layers**:

1. **CSS Custom Properties** (`src/styles/tokens.css`) — the source of truth, theme-switchable.
2. **Tailwind Config** (`tailwind.config.ts`) — maps CSS variables to utility classes.

```ts
// tailwind.config.ts (conceptual)
colors: {
  bg: {
    primary: 'var(--color-bg-primary)',
    secondary: 'var(--color-bg-secondary)',
  },
  // ...
}
```

This ensures utilities like `bg-bg-primary` work and respond to theme changes.

---

## 15. Accessibility in Design

- **Focus visible:** every interactive element has a visible focus ring.
- **Hit targets:** minimum 44×44px on touch devices.
- **Color independence:** information never conveyed by color alone (icons + text).
- **Motion:** all animation respects `prefers-reduced-motion`.

---

_This design system is the contract between design and engineering. If a value isn't here, it doesn't exist in the product._
