"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/3d/hooks/useReducedMotion";
import { cn } from "@/utils/cn";

/**
 * A reading-progress bar fixed at the top of the viewport
 * (blog-page-design §14.8).
 *
 * Scales its width with scroll progress (0→100%) using a rAF-throttled
 * scroll listener. Under reduced motion the width still updates but with no
 * transition. Carries `role="progressbar"` + `aria-valuenow` for
 * accessibility (§21).
 *
 * A Client Component because it reads scroll position.
 */
export function ReadingProgress() {
    const prefersReducedMotion = useReducedMotion();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const scrollTop = window.scrollY;
            const docHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setProgress(Math.min(100, Math.max(0, value)));
        };
        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
            className="fixed left-0 top-0 z-50 h-0.5 w-full bg-transparent"
        >
            <div
                className={cn(
                    "h-full bg-accent-gradient",
                    prefersReducedMotion
                        ? "transition-none"
                        : "transition-[width] duration-fast ease-linear",
                )}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

ReadingProgress.displayName = "ReadingProgress";
