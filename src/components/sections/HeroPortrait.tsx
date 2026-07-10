"use client";

import { useEffect } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";

import { ResponsiveImage } from "@/components/shared/ResponsiveImage";
import { cn } from "@/utils/cn";
import type { PublicImage } from "@/lib/admin/public-data";

interface HeroPortraitProps {
    /**
     * Shared hero scroll progress (0 → 1 across the hero section). Provided by
     * the HeroSection orchestrator so all scroll-exit transforms share one
     * `useScroll` listener.
     */
    scrollProgress: MotionValue<number>;
    /**
     * Resolved profile image descriptor (from `getPublicHeroPortrait`). When
     * `null`, the monogram placeholder renders. The image is eager-loaded
     * (priority) because it is above-the-fold LCP content.
     */
    image?: PublicImage | null;
    className?: string;
}

/** Max mouse-parallax offset in px (hero-design §5.3: ±8px). */
const MOUSE_RANGE = 8;
/** Scroll parallax drift in px over the full hero scroll (0.7× feel). */
const SCROLL_DRIFT = 300;

/**
 * Hero portrait (hero-design §5).
 *
 * A transparent-background portrait floating in a glass frame with three
 * layered motions: mouse parallax (±8px, opposite direction, damped), scroll
 * parallax (drifts up as the page scrolls), and an idle float (±4px sine, 6s).
 * A soft accent glow sits behind the frame.
 *
 * Reduced motion: fully static. Touch devices: mouse parallax disabled.
 *
 * Until a transparent PNG asset is committed, a stylized "KK" monogram
 * placeholder renders inside the frame so the layout and motion are verifiable.
 */
export function HeroPortrait({
    scrollProgress,
    image,
    className,
}: HeroPortraitProps) {
    const reduced = useReducedMotion() === true;

    // Mouse parallax (desktop only) — normalized -1..1, damped via spring.
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { stiffness: 40, damping: 12, mass: 0.5 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (reduced) return;
        if (typeof window === "undefined") return;
        // Touch / coarse pointers get no mouse parallax (hero-design §5.4).
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (!fine) return;
        const onMove = (e: MouseEvent) => {
            mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
            mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        return () => window.removeEventListener("mousemove", onMove);
    }, [reduced, mouseX, mouseY]);

    // Opposite direction for depth illusion; combine mouse + scroll on Y.
    const parallaxX = useTransform(springX, (v) => -v * MOUSE_RANGE);
    const mouseParallaxY = useTransform(springY, (v) => -v * MOUSE_RANGE);
    const scrollY = useTransform(scrollProgress, [0, 1], [0, -SCROLL_DRIFT]);
    const combinedY = useTransform(
        [mouseParallaxY, scrollY] as MotionValue<number>[],
        ([my, sy]: number[]) => (my ?? 0) + (sy ?? 0),
    );
    // Fade out by ~30% scroll (hero-design §8 scroll-exit).
    const opacity = useTransform(scrollProgress, [0.2, 0.35], [1, 0]);

    if (reduced) {
        return (
            <div className={cn("relative", className)}>
                <PortraitFrame image={image} />
            </div>
        );
    }

    return (
        <motion.div
            className={cn("relative will-change-transform", className)}
            style={{ x: parallaxX, y: combinedY, opacity }}
        >
            {/* Idle float — separate transform layer so it composes cleanly. */}
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <PortraitFrame image={image} />
            </motion.div>
        </motion.div>
    );
}

/** The glass frame + glow + portrait image (or monogram placeholder). */
function PortraitFrame({ image }: { image?: PublicImage | null }) {
    return (
        <div className="relative">
            {/* Soft accent glow behind the frame (hero-design §5.2). */}
            <div
                className="absolute inset-0 -z-10 rounded-2xl bg-accent-gradient opacity-30 blur-2xl"
                aria-hidden="true"
            />

            {/* Glass frame */}
            <div
                className={cn(
                    "glass-surface flex items-center justify-center overflow-hidden rounded-2xl border border-border-glass shadow-glass",
                    "h-[250px] w-[200px]",
                    "md:h-[325px] md:w-[260px]",
                    "lg:h-[400px] lg:w-[320px]",
                )}
            >
                {image ? (
                    <ResponsiveImage
                        image={image}
                        alt="Portrait"
                        priority
                        sizes="(max-width: 768px) 200px, (max-width: 1024px) 260px, 320px"
                        className="h-full w-full"
                        imgClassName="rounded-2xl"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent-solid/40 bg-accent-subtle/30 md:h-28 md:w-28 lg:h-32 lg:w-32">
                            <span className="bg-accent-gradient text-gradient font-sans text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
                                KK
                            </span>
                        </div>
                        <span className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                            portrait pending
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

HeroPortrait.displayName = "HeroPortrait";
