import type { Config } from "tailwindcss";

/**
 * Tailwind config for Kandarp OS.
 * Maps CSS custom properties (defined in src/styles/tokens.css) to utilities.
 * Components consume tokens via utilities — never raw values.
 */
const config: Config = {
    // The site is dark-only. `dark:` variants are driven by the static
    // `data-theme="dark"` attribute on <html> (set in the root layout) rather
    // than `prefers-color-scheme`, so they always apply regardless of the
    // visitor's OS theme preference.
    darkMode: ["class", '[data-theme="dark"]'],
    // IMPORTANT: every directory that contains components using Tailwind
    // utility classes MUST be listed here. In development, Tailwind's JIT
    // compiler watches the whole project and generates classes on demand,
    // so a missing path is invisible. In production, the purge step ONLY
    // scans the paths listed here — any class used in an unlisted directory
    // is stripped from the final CSS, which is exactly what caused the
    // production layout to break (hero compressed, buttons stretching,
    // Three.js overlapping, navbar misaligned, etc.).
    content: [
        "./src/app/**/*.{ts,tsx}",
        "./src/features/**/*.{ts,tsx}",
        "./src/packages/**/*.{ts,tsx}",
        "./src/infrastructure/**/*.{ts,tsx}",
        "./src/backend/**/*.{ts,tsx}",
        "./src/data/**/*.{ts,tsx}",
        "./src/services/**/*.{ts,tsx}",
        "./src/lib/**/*.{ts,tsx}",
        // Legacy/compat paths (some imports still resolve here).
        "./src/components/**/*.{ts,tsx}",
        "./src/hooks/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                canvas: {
                    base: "var(--canvas-base)",
                    elevated: "var(--canvas-elevated)",
                    sunken: "var(--canvas-sunken)",
                    tint: "var(--canvas-tint)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    tertiary: "var(--text-tertiary)",
                    quaternary: "var(--text-quaternary)",
                    inverse: "var(--text-inverse)",
                },
                accent: {
                    solid: "var(--accent-solid)",
                    hover: "var(--accent-hover)",
                    subtle: "var(--accent-subtle)",
                    warm: "var(--warm-accent-subtle)",
                },
                warm: {
                    orange: "var(--aws-orange)",
                    amber: "var(--amber)",
                    gold: "var(--soft-gold)",
                    copper: "var(--copper)",
                    subtle: "var(--warm-accent-subtle)",
                },
                glass: {
                    bg: "var(--glass-bg)",
                    "bg-strong": "var(--glass-bg-strong)",
                    "bg-subtle": "var(--glass-bg-subtle)",
                },
                success: "var(--success)",
                warning: "var(--warning)",
                error: "var(--error)",
                info: "var(--info)",
                traffic: {
                    close: "var(--traffic-close)",
                    minimize: "var(--traffic-minimize)",
                    zoom: "var(--traffic-zoom)",
                },
                cyan: {
                    DEFAULT: "var(--cloud-cyan)",
                    subtle: "rgba(56, 189, 248, 0.12)",
                },
                term: {
                    bg: "var(--term-bg)",
                    "bg-elevated": "var(--term-bg-elevated)",
                    prompt: "var(--term-prompt)",
                    directory: "var(--term-directory)",
                    command: "var(--term-command)",
                    value: "var(--term-value)",
                    label: "var(--term-label)",
                    success: "var(--term-success)",
                    accent: "var(--term-accent)",
                    warning: "var(--term-warning)",
                    comment: "var(--term-comment)",
                    cursor: "var(--term-cursor)",
                    divider: "var(--term-divider)",
                },
                border: {
                    subtle: "var(--border-subtle)",
                    DEFAULT: "var(--border-default)",
                    strong: "var(--border-strong)",
                    glass: "var(--border-glass)",
                    focus: "var(--border-focus)",
                    accent: "var(--border-accent)",
                },
            },
            fontFamily: {
                sans: [
                    "var(--font-sans)",
                    "-apple-system",
                    "system-ui",
                    "sans-serif",
                ],
                mono: ["var(--font-mono)", "ui-monospace", "monospace"],
            },
            fontSize: {
                "2xs": [
                    "0.6875rem",
                    { lineHeight: "1.45", letterSpacing: "0.05em" },
                ],
                xs: [
                    "0.75rem",
                    { lineHeight: "1.50", letterSpacing: "0.01em" },
                ],
                sm: ["0.875rem", { lineHeight: "1.55" }],
                base: ["1rem", { lineHeight: "1.60" }],
                lg: ["1.125rem", { lineHeight: "1.50" }],
                h4: [
                    "1.25rem",
                    { lineHeight: "1.30", letterSpacing: "-0.01em" },
                ],
                h3: [
                    "1.5rem",
                    { lineHeight: "1.25", letterSpacing: "-0.015em" },
                ],
                h2: [
                    "1.875rem",
                    { lineHeight: "1.20", letterSpacing: "-0.02em" },
                ],
                h1: [
                    "2.25rem",
                    { lineHeight: "1.15", letterSpacing: "-0.025em" },
                ],
                "display-lg": [
                    "3rem",
                    { lineHeight: "1.10", letterSpacing: "-0.03em" },
                ],
                "display-xl": [
                    "3.75rem",
                    { lineHeight: "1.05", letterSpacing: "-0.035em" },
                ],
                "display-2xl": [
                    "4.5rem",
                    { lineHeight: "1.05", letterSpacing: "-0.04em" },
                ],
            },
            spacing: {
                px: "0.0625rem",
                0.5: "0.125rem",
                1.5: "0.375rem",
                18: "4.5rem",
                22: "5.5rem",
            },
            borderRadius: {
                xs: "4px",
                sm: "6px",
                md: "8px",
                lg: "12px",
                xl: "16px",
                "2xl": "20px",
                "3xl": "24px",
            },
            boxShadow: {
                xs: "0 1px 2px rgba(0,0,0,0.04)",
                sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                md: "0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
                lg: "0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
                xl: "0 24px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.04)",
                "2xl": "0 32px 64px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.06)",
                glass: "0 4px 16px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.20)",
                "glass-hover":
                    "0 12px 32px rgba(0,0,0,0.40), 0 4px 8px rgba(0,0,0,0.25)",
                "glass-modal":
                    "0 24px 64px rgba(0,0,0,0.50), 0 8px 24px rgba(0,0,0,0.35)",
                "glow-sm": "0 0 20px rgba(36,150,237,0.20)",
                "glow-md": "0 0 40px rgba(36,150,237,0.25)",
                "glow-lg": "0 0 80px rgba(36,150,237,0.30)",
                "warm-glow-sm": "0 0 18px rgba(255,153,0,0.18)",
                "warm-glow-md": "0 0 34px rgba(255,153,0,0.22)",
                "warm-glow-lg": "0 0 60px rgba(255,153,0,0.15)",
            },
            backdropBlur: {
                glass: "16px",
                "glass-strong": "24px",
                "glass-subtle": "8px",
            },
            transitionTimingFunction: {
                standard: "cubic-bezier(0.4, 0, 0.2, 1)",
                enter: "cubic-bezier(0, 0, 0.2, 1)",
                exit: "cubic-bezier(0.4, 0, 1, 1)",
                spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                smooth: "cubic-bezier(0.45, 0, 0.15, 1)",
            },
            transitionDuration: {
                instant: "0ms",
                fast: "120ms",
                normal: "200ms",
                slow: "320ms",
                slower: "480ms",
                cinematic: "640ms",
            },
            keyframes: {
                "cursor-blink": {
                    "0%, 49%": { opacity: "1" },
                    "50%, 100%": { opacity: "0" },
                },
                "fade-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                // Active-deployment status pulse (experience-page-design §8.4).
                // Scale 1→1.3→1 + opacity 1→0.6→1, 2s loop, ease-smooth.
                "status-pulse": {
                    "0%, 100%": { transform: "scale(1)", opacity: "1" },
                    "50%": { transform: "scale(1.3)", opacity: "0.6" },
                },
                // Active skill-node ring pulse (skills-page-design §4.6).
                // Ring opacity 1→0.5→1 + scale 1→1.06→1, 2.4s loop, ease-smooth.
                "mesh-pulse": {
                    "0%, 100%": { transform: "scale(1)", opacity: "1" },
                    "50%": { transform: "scale(1.06)", opacity: "0.5" },
                },
                // Learning skill-node dashed-ring slow rotate (§4.7), 8s linear.
                "mesh-spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
            },
            animation: {
                "cursor-blink": "cursor-blink 530ms step-end infinite",
                "fade-up": "fade-up 320ms cubic-bezier(0, 0, 0.2, 1) both",
                "status-pulse":
                    "status-pulse 2000ms cubic-bezier(0.45, 0, 0.15, 1) infinite",
                "mesh-pulse":
                    "mesh-pulse 2400ms cubic-bezier(0.45, 0, 0.15, 1) infinite",
                "mesh-spin": "mesh-spin 8000ms linear infinite",
            },
        },
    },
    plugins: [],
};

export default config;
