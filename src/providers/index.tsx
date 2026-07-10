"use client";

import type { ReactNode } from "react";

import { AnimationProvider } from "@/providers/AnimationProvider";
import { ThreeProvider } from "@/providers/ThreeProvider";

/**
 * Composed provider tree — Kandarp OS.
 *
 * Mounted once in the root layout (folder-structure §4.11). Order matters:
 *
 *   1. **AnimationProvider** — initializes Lenis + GSAP scroll-linked motion.
 *   2. **ThreeProvider** — 3D is the most progressive enhancement; it depends
 *      on animation being ready.
 *
 * The site is dark-only: tokens resolve to the dark palette on `:root` (see
 * `src/styles/tokens.css`) and `data-theme="dark"` is set statically on
 * `<html>` in the root layout. There is no theme context or runtime switch.
 *
 * Each provider is thin (provides context, not logic) per component-rules §3.3.
 */
export function Providers({ children }: { children: ReactNode }) {
    return (
        <AnimationProvider>
            <ThreeProvider>{children}</ThreeProvider>
        </AnimationProvider>
    );
}
