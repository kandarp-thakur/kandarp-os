"use client";

/**
 * Mouse parallax for the DevOps background.
 *
 * Implements docs/devops-background.md §6.1: the whole constellation shifts
 * ±0.5 units based on pointer position, smoothed (damp 0.08) — no jitter.
 *
 * Performance contract (docs/animation-design.md §6.5):
 *  - One `pointermove` listener (no rAF polling of the pointer).
 *  - A single shared rAF loop damps the target → current position.
 *  - Writes to a ref consumed by CSS custom properties on the container —
 *    **no React re-render per frame**.
 *  - Disabled on touch / reduced-motion / low tier (caller decides).
 *  - Pauses when the tab is hidden.
 */

import { useEffect, useRef } from "react";

export interface ParallaxState {
    /** Current smoothed X offset in range [-1, 1] (0 = center). */
    x: number;
    /** Current smoothed Y offset in range [-1, 1] (0 = center). */
    y: number;
}

interface UseParallaxOptions {
    /** Whether parallax is enabled (tier + reduced-motion gate). */
    enabled: boolean;
    /** Damping factor per frame (0–1). Lower = smoother/slower. Default 0.08. */
    damp?: number;
    /** Max shift in px applied to the constellation container. Default 18. */
    range?: number;
}

/**
 * Track the pointer and expose a smoothed parallax offset via a ref. The caller
 * applies the offset to the scene container through CSS custom properties in
 * the same rAF tick (see DevOpsBackground).
 */
export function useParallax({
    enabled,
    damp = 0.08,
    range = 18,
}: UseParallaxOptions) {
    const state = useRef<ParallaxState>({ x: 0, y: 0 });
    const target = useRef<ParallaxState>({ x: 0, y: 0 });
    const raf = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) {
            // Snap to rest when disabled so re-enabling doesn't jump.
            state.current = { x: 0, y: 0 };
            target.current = { x: 0, y: 0 };
            return;
        }

        const onPointer = (e: PointerEvent) => {
            // Normalize to [-1, 1] from viewport center.
            target.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1,
            };
        };

        const tick = () => {
            // Exponential smoothing toward the target.
            state.current.x += (target.current.x - state.current.x) * damp;
            state.current.y += (target.current.y - state.current.y) * damp;
            raf.current = requestAnimationFrame(tick);
        };

        const onVisibility = () => {
            if (document.hidden && raf.current !== null) {
                cancelAnimationFrame(raf.current);
                raf.current = null;
            } else if (!document.hidden && raf.current === null) {
                raf.current = requestAnimationFrame(tick);
            }
        };

        window.addEventListener("pointermove", onPointer, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        raf.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("pointermove", onPointer);
            document.removeEventListener("visibilitychange", onVisibility);
            if (raf.current !== null) cancelAnimationFrame(raf.current);
            raf.current = null;
        };
    }, [enabled, damp]);

    return { state, range };
}
