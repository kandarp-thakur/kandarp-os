"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the current viewport is desktop-width. Used to gate
 * desktop-only interactions such as orbit controls (arch §1.5) and hover
 * effects (arch §8.5). Mobile is tap-only.
 *
 * The breakpoint matches the project's `md` Tailwind token (768px) so the 3D
 * layer and the DOM layout agree on what "desktop" means.
 *
 * SSR-safe: defaults to `true` (optimistic desktop) and reconciles on mount.
 *
 * @returns `true` when the viewport is at least 768px wide.
 */
export function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const query = window.matchMedia("(min-width: 768px)");
        setIsDesktop(query.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setIsDesktop(event.matches);
        };

        query.addEventListener("change", handleChange);
        return () => query.removeEventListener("change", handleChange);
    }, []);

    return isDesktop;
}
