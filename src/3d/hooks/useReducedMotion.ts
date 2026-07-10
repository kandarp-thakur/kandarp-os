"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting (arch §1.5, §15).
 * Every motion-driven system reads this and disables idle breathing,
 * parallax, and animated effects when the user has requested reduced motion.
 *
 * SSR-safe: returns `false` on the server and during the first client render,
 * then updates after mount. This avoids hydration mismatches while still
 * respecting the real preference as soon as the browser reports it.
 *
 * @returns `true` when the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(query.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setReduced(event.matches);
        };

        // `addEventListener` is the modern API; `addListener` is the legacy
        // fallback for older Safari. Prefer the modern path.
        query.addEventListener("change", handleChange);
        return () => query.removeEventListener("change", handleChange);
    }, []);

    return reduced;
}
