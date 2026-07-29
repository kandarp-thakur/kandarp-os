"use client";

import { motion, type MotionValue } from "framer-motion";

import { cn } from "@utils/cn";

interface ScrollProgressProps {
    /** Normalized viewport scroll progress (0 → 1). */
    progress: MotionValue<number>;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * A 2px gradient progress bar fixed to the top of the viewport that tracks
 * reading progress (navigation-design §9.1). Sits above the navbar and is
 * hidden at the very top (progress = 0).
 */
export function ScrollProgress({ progress, className }: ScrollProgressProps) {
    return (
        <motion.div
            aria-hidden="true"
            style={{ scaleX: progress }}
            className={cn(
                "fixed inset-x-0 top-0 z-[60] h-0.5 origin-left",
                "bg-[linear-gradient(90deg,var(--docker-blue),var(--cloud-cyan)_72%,var(--soft-gold))] opacity-80 shadow-glow-sm",
                className,
            )}
        />
    );
}

ScrollProgress.displayName = "ScrollProgress";
