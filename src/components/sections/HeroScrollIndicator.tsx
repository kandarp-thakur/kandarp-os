"use client";

import {
    motion,
    useReducedMotion,
    useTransform,
    type MotionValue,
} from "framer-motion";
import { ChevronDown } from "lucide-react";

import { HERO_MOTION } from "@/data/hero";
import { cn } from "@/utils/cn";

interface HeroScrollIndicatorProps {
    /**
     * Shared hero scroll progress (0 → 1). The indicator fades out within the
     * first 5% of scroll (hero-design §8 scroll-exit).
     */
    scrollProgress: MotionValue<number>;
    className?: string;
}

/**
 * Hero scroll indicator (hero-design §6 + animation-design §2.2).
 *
 * A centered chevron at the bottom of the hero that bounces gently (1500ms
 * loop) to cue the user to scroll, and fades out as soon as scrolling begins.
 * Reduced motion: static chevron, no bounce.
 */
export function HeroScrollIndicator({
    scrollProgress,
    className,
}: HeroScrollIndicatorProps) {
    const reduced = useReducedMotion() === true;
    const opacity = useTransform(scrollProgress, [0, 0.05], [1, 0]);

    if (reduced) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center gap-1 text-text-tertiary",
                    className,
                )}
                aria-hidden="true"
            >
                <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </div>
        );
    }

    return (
        <motion.div
            className={cn(
                "flex flex-col items-center gap-1 text-text-tertiary",
                className,
            )}
            style={{ opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                delay: HERO_MOTION.delay.indicator,
                duration: HERO_MOTION.duration.slow,
                ease: HERO_MOTION.ease.enter,
            }}
            aria-hidden="true"
        >
            <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </motion.span>
            <span className="font-mono text-2xs uppercase tracking-[0.15em]">
                scroll
            </span>
        </motion.div>
    );
}

HeroScrollIndicator.displayName = "HeroScrollIndicator";
