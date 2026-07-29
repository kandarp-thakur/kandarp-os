/**
 * Font configuration — Kandarp OS.
 *
 * Fonts are defined as CSS custom properties in `src/styles/tokens.css`
 * using system font stacks (no network fetch required). This avoids the
 * `next/font/google` build-time fetch which fails when there is no internet
 * access (ETIMEDOUT) and can destabilize the webpack chunk cache.
 *
 *   - **Inter** — display + body (ui-system §2.2). Geometric, SF Pro–like.
 *     Falls back to the native system UI font stack when Inter is unavailable.
 *   - **JetBrains Mono** — code / terminal (ui-system §2.2). Ligatures,
 *     readable at small sizes. Falls back to the native monospace stack.
 *
 * The variables `--font-sans` and `--font-mono` are already declared in
 * `tokens.css`, so `fontVariables` is intentionally empty — applying it is
 * a no-op that keeps the layout code stable without pulling in a network
 * font loader.
 */

/**
 * Combined className to apply on `<html>` (or `<body>`).
 *
 * Empty string because the CSS variables are declared globally in
 * `tokens.css` (imported via `globals.css`). Kept as an export so the
 * layout's `className` interpolation stays valid without conditional logic.
 */
export const fontVariables = "";
