import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Font configuration — Kandarp OS.
 *
 * All fonts load via `next/font` for zero layout shift (coding-standards §9,
 * ui-system §2.2). Each font exposes a CSS variable that the Tailwind config
 * (`tailwind.config.ts`) and `tokens.css` consume — components never load
 * fonts via `<link>`.
 *
 *   - **Inter** — display + body (ui-system §2.2). Geometric, SF Pro–like.
 *   - **JetBrains Mono** — code / terminal (ui-system §2.2). Ligatures,
 *     readable at small sizes.
 *
 * Both are subset to Latin and preloaded to keep the font budget < 100 KB
 * (architecture §9.1).
 */

export const fontSans = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
    preload: true,
});

export const fontMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
    preload: true,
});

/** Combined className to apply on `<html>` (or `<body>`). */
export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
