# Style Guide — Kandarp OS (Phase 1)

The visual language, design tokens, and code-style conventions for Kandarp OS.

## 1. Aesthetic

A **dark, terminal/OS-themed** engineering interface. Glassmorphism surfaces, monospace accents, Docker-blue + cyan highlights, and a living 3D infrastructure background. The vibe is "a DevOps engineer's operating system booting up."

## 2. Design Tokens

All tokens are CSS custom properties defined in [`src/infrastructure/styles/tokens.css`](../src/infrastructure/styles/tokens.css) and mapped into Tailwind via [`tailwind.config.ts`](../tailwind.config.ts). **Always use token classes** — never raw hex values in components.

### Color

| Token class            | Use                          |
| ---------------------- | ---------------------------- |
| `bg-canvas-base`       | page background              |
| `bg-surface-*`         | raised surfaces              |
| `text-text-primary`    | primary text                 |
| `text-text-secondary`  | secondary text               |
| `text-text-tertiary`   | muted text                   |
| `text-accent-solid`    | Docker-blue accent           |
| `text-cyan`            | cyan highlight               |
| `text-success/warning/error/info` | status colors     |

### Typography

- **Heading:** Space Grotesk (`font-sans` for headings via `font-heading`).
- **Body:** Inter (`font-sans`).
- **Mono:** JetBrains Mono (`font-mono`) — used for terminal text, stats, labels.

### Spacing / Radius / Shadow / Animation

- Spacing, border-radius, shadow, and animation-duration are all token-driven (`duration-slow`, `ease-smooth`, `shadow-glow-sm`, `rounded-lg`, etc.).
- See [`docs/design-system.md`](design-system.md) for the full token reference.

## 3. Glassmorphism

Use the `.glass-surface` utility (defined in `globals.css`) for frosted panels. Combine with `shadow-glass-hover` on interactive elements. Keep glass layers subtle — the 3D background should read through them.

## 4. Tailwind Conventions

- **Class ordering:** layout → box → typography → color → effect → state. (Enforced by Prettier.)
- **Conditional classes:** always via the `cn()` helper, never string concatenation.
- **Variants:** use `class-variance-authority` for primitives (see [`src/packages/ui/Button.tsx`](../src/packages/ui/Button.tsx)).
- **Responsive:** mobile-first (`sm:`, `md:`, `lg:`).

## 5. Code Style

- **TypeScript strict** — no `any`, no unchecked index access, no implicit overrides.
- **Naming:** `PascalCase` for components/types, `camelCase` for functions/variables, `SCREAMING_SNAKE_CASE` for constants.
- **Imports:** path aliases (`@features/*`, `@packages/*`, etc.); group external → alias → relative.
- **No `console.*`** in committed code (stripped in production anyway).
- **No `TODO`/`FIXME`** without a linked issue.
- **Files:** one default export per component file; co-locate sub-components in the same folder.
- **Formatting:** Prettier (config in [`.prettierrc`](../.prettierrc)) — run `npm run format`.

## 6. Accessibility

- Semantic HTML (`<section>`, `<nav>`, `<header>`, `<footer>`, `<main>`).
- Every interactive element is keyboard-reachable with a visible focus ring (`focus-visible:ring-accent-solid`).
- Skip-nav link ([`SkipNav`](../src/features/navigation/components/SkipNav.tsx)) is the first focusable element.
- `aria-label` on icon-only controls; `sr-only` text where needed.
- Respect `prefers-reduced-motion` (see `useReducedMotion`).
- Color contrast meets WCAG AA on all text.

## 7. Performance Conventions

- Lazy-load heavy client components with `next/dynamic` where they are below the fold.
- Keep 3D behind `<Suspense>` + a fallback.
- Use `next/image` / `ResponsiveImage` for all raster images.
- Avoid layout thrash: prefer CSS transforms over geometry-changing properties for animation.

## 8. Verification

```bash
npm run format:check   # prettier check
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run verify         # typecheck + lint
```
