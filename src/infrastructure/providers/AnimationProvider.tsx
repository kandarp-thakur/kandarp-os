"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * Animation Provider — Kandarp OS.
 *
 * Owns the two global animation systems that must be initialized once at the
 * app root (animation-design §3.1, §3.3):
 *
 *   1. **Lenis** — smooth scroll on `<html>`. Owns the scroll position so every
 *      scroll-linked animation (Framer `useScroll`, GSAP ScrollTrigger) feels
 *      cohesive. Disabled on touch (`smoothTouch: false`) and under reduced
 *      motion (instant scroll).
 *   2. **GSAP + ScrollTrigger** — registered globally for scene-level tweens
 *      (timeline fill, constellation fade). GSAP never animates DOM UI — that
 *      is Framer Motion's domain (animation-design §3.1 boundary rule).
 *
 * A single shared `requestAnimationFrame` loop drives Lenis and keeps
 * ScrollTrigger in sync (`lenis.on('scroll', ScrollTrigger.update)`).
 *
 * Boundary: this provider renders no UI — it only initializes/cleans up the
 * animation systems. It must be a Client Component (uses `window`).
 */
export function AnimationProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Respect reduced motion: do not initialize Lenis or scroll-triggers.
        // Scroll-linked animations resolve to their in-view state (animation-design §3.3).
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReducedMotion) {
            return;
        }

        // Register GSAP plugin once. Safe to call repeatedly — GSAP dedupes.
        gsap.registerPlugin(ScrollTrigger);

        // Lenis config per animation-design §3.3.
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            // Native touch momentum is better — never fight iOS (animation-design §3.3).
            // `syncTouch: false` keeps native touch scroll (Lenis v1 API).
            syncTouch: false,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
            infinite: false,
        });

        // Keep ScrollTrigger in sync with Lenis-driven scroll.
        lenis.on("scroll", ScrollTrigger.update);

        // Shared RAF loop: drives Lenis. ScrollTrigger reads from it.
        let frameId = 0;
        const raf = (time: number) => {
            lenis.raf(time);
            frameId = window.requestAnimationFrame(raf);
        };
        frameId = window.requestAnimationFrame(raf);

        return () => {
            window.cancelAnimationFrame(frameId);
            lenis.destroy();
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
    }, []);

    return <>{children}</>;
}
