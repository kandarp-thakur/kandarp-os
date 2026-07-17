"use client";

import { memo, useEffect } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";

import { ResponsiveImage } from "@/components/shared/ResponsiveImage";
import { HeroPortrait3D } from "@/components/sections/HeroPortrait3D";
import { cn } from "@/utils/cn";
import type { PublicImage, PublicSiteIdentity } from "@/lib/admin/public-data";

interface HeroPortraitProps {
    /**
     * Shared hero scroll progress (0 → 1 across the hero section). Provided by
     * the HeroSection orchestrator so all scroll-exit transforms share one
     * `useScroll` listener.
     */
    scrollProgress: MotionValue<number>;
    /**
     * Resolved profile image descriptor (from `getPublicHeroPortrait`). When
     * `null`, a refined abstract system-core visual renders instead of the old
     * 3D coder figure. The image is eager-loaded (priority) because it is
     * above-the-fold LCP content.
     */
    image?: PublicImage | null;
    avatar?: PublicSiteIdentity["heroAvatar"];
    className?: string;
}

/** Max mouse-parallax offset in px (hero-design §5.3: ±8px). */
const MOUSE_RANGE = 8;
/** Scroll parallax drift in px over the full hero scroll (0.7× feel). */
const SCROLL_DRIFT = 300;

/**
 * Hero portrait (hero-design §5).
 *
 * A transparent-background portrait floating frameless with three layered
 * motions: mouse parallax (±8px, opposite direction, damped), scroll parallax
 * (drifts up as the page scrolls), and an idle float (±4px sine, 6s). A soft
 * ambient glow sits behind the figure — no card, no box, no rectangular frame
 * (the redesigned 3D coder mascot floats naturally in front of the DevOps
 * Infinity background).
 *
 * Reduced motion: fully static. Touch devices: mouse parallax disabled.
 *
 * Until a transparent PNG asset is committed, a refined abstract system-core
 * visual renders in the same footprint. It keeps the OS/DevOps identity without
 * showing a cartoon-like 3D character.
 */
export function HeroPortrait({
    scrollProgress,
    image,
    avatar,
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
                <PortraitFrame image={image} avatar={avatar} />
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
                <PortraitFrame image={image} avatar={avatar} />
            </motion.div>
        </motion.div>
    );
}

/**
 * The frameless portrait container + soft ambient glow + portrait image (or
 * abstract system-core fallback). No glass card, no box, no rectangular frame —
 * the visual floats naturally in front of the DevOps Infinity background. A soft
 * radial glow sits behind it so it reads as "floating in light", not "floating
 * in a box".
 */
function PortraitFrame({
    image,
    avatar,
}: {
    image?: PublicImage | null;
    avatar?: PublicSiteIdentity["heroAvatar"];
}) {
    return (
        <div className="relative">
            {/* Soft ambient glow behind the figure — a large radial gradient
                (Docker Blue + AWS Orange) so the character feels integrated into the
                environment, not boxed. No card, no frame. */}
            <div
                className="absolute inset-0 -z-10 blur-2xl"
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 45%, var(--hero-ambient-orange, rgba(255,153,0,0.10)) 0%, var(--hero-ambient-blue, rgba(59,130,246,0.14)) 45%, transparent 75%)",
                }}
            />

            {/* Frameless container — same footprint as the old glass frame so
                the hero layout is unchanged, but with no surface, border, or
                shadow. */}
            <div
                className={cn(
                    "relative flex items-center justify-center overflow-visible",
                    "h-[250px] w-[240px]",
                    "md:h-[325px] md:w-[320px]",
                    "lg:h-[430px] lg:w-[380px] xl:h-[480px] xl:w-[430px]",
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
                    // No portrait image committed yet → render a professional
                    // abstract OS-core visual instead of the 3D cartoon/coder
                    // character. This keeps the hero premium and lightweight.
                    <MemoizedHeroSystemCore avatar={avatar} />
                )}
            </div>
        </div>
    );
}

function HeroSystemCore({
    avatar,
}: {
    avatar?: PublicSiteIdentity["heroAvatar"];
}) {
    const reduced = useReducedMotion() === true;

    return (
        <div
            className="relative flex h-full w-full items-center justify-center"
            aria-hidden="true"
        >
            <motion.div
                className="absolute h-[54%] w-[92%] rounded-[999px] border border-sky-300/25 bg-sky-400/10 will-change-transform"
                animate={
                    reduced
                        ? undefined
                        : { rotate: [0, 1.2, 0], scale: [1, 1.012, 1] }
                }
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute h-[46%] w-[78%] rounded-[999px] border border-blue-400/25 bg-blue-500/10 will-change-transform"
                animate={
                    reduced
                        ? undefined
                        : { rotate: [0, -1.4, 0], scale: [1, 0.992, 1] }
                }
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute h-[38%] w-[64%] rounded-[999px] bg-[conic-gradient(from_120deg,rgba(56,189,248,0),rgba(56,189,248,0.24),rgba(255,153,0,0.18),rgba(56,189,248,0))] opacity-70 will-change-transform"
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />

            <div className="absolute left-[8%] top-[20%] rounded-lg border border-sky-300/25 bg-canvas-elevated/55 px-2 py-1 font-mono text-[10px] text-sky-200/80 shadow-glow-sm">
                docker build
            </div>
            <div className="absolute right-[5%] top-[28%] rounded-lg border border-blue-400/25 bg-canvas-elevated/55 px-2 py-1 font-mono text-[10px] text-blue-200/80 shadow-glow-sm">
                kubectl apply
            </div>
            <div className="absolute bottom-[24%] left-[10%] h-2 w-2 rounded-full bg-success shadow-glow-sm" />
            <div className="absolute bottom-[32%] right-[14%] h-2 w-2 rounded-full bg-info shadow-glow-sm" />
            <div className="absolute left-[18%] top-[34%] h-px w-[26%] rotate-12 bg-gradient-to-r from-transparent via-accent-solid/40 to-transparent" />
            <div className="absolute right-[18%] top-[42%] h-px w-[24%] -rotate-12 bg-gradient-to-r from-transparent via-info/40 to-transparent" />

            <HeroPortrait3D
                avatar={avatar}
                className="absolute bottom-[4%] right-[8%] h-[62%] w-[38%] min-w-[120px] md:right-[9%] md:h-[64%] md:w-[36%] lg:right-[8%] lg:h-[66%] lg:w-[34%]"
            />
        </div>
    );
}

const MemoizedHeroSystemCore = memo(HeroSystemCore);

HeroPortrait.displayName = "HeroPortrait";
MemoizedHeroSystemCore.displayName = "HeroSystemCore";
