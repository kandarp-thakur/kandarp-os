"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "framer-motion";

import { cn } from "@utils/cn";

interface AvatarProps {
    /**
     * Path to a transparent-background PNG served from /public
     * (e.g. "/images/avatar.png"). The soft drop-shadow contours the image
     * alpha, so the avatar silhouette — not the bounding box — casts the
     * shadow.
     */
    src: string;
    /** Accessible description of the image; pass "" only for decorative avatars. */
    alt: string;
    /** Responsive size preset. Defaults to "md". */
    size?: "sm" | "md" | "lg" | "xl";
    /** Prioritize loading for above-the-fold avatars. Defaults to false. */
    priority?: boolean;
    /** Enable the idle floating animation. Defaults to true. */
    float?: boolean;
    /** Enable the mouse-follow 3D tilt. Defaults to true. */
    tilt?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
}

/** Max tilt rotation in degrees (±). */
const TILT_RANGE = 8;
/** Float amplitude in px (±). */
const FLOAT_AMPLITUDE = 8;
/** Float cycle duration in seconds (animation token: float-loop = 6000ms). */
const FLOAT_DURATION = 6;
/** Spring config for tilt damping (ui-system §10.5: spring-smooth). */
const TILT_SPRING = { stiffness: 300, damping: 26, mass: 1 };

const SIZE_PRESETS: Record<NonNullable<AvatarProps["size"]>, string> = {
    sm: "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32",
    md: "h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40",
    lg: "h-40 w-40 sm:h-44 sm:w-44 md:h-48 md:w-48",
    xl: "h-48 w-48 sm:h-52 sm:w-52 md:h-56 md:w-56",
};

const SIZE_SOURCES: Record<NonNullable<AvatarProps["size"]>, string> = {
    sm: "(max-width: 640px) 96px, (max-width: 768px) 112px, 128px",
    md: "(max-width: 640px) 128px, (max-width: 768px) 144px, 160px",
    lg: "(max-width: 640px) 160px, (max-width: 768px) 176px, 192px",
    xl: "(max-width: 640px) 192px, (max-width: 768px) 208px, 224px",
};

/**
 * Avatar — a transparent-PNG portrait with a mouse-follow 3D tilt, an idle
 * floating animation, and a soft drop-shadow that contours the image alpha.
 *
 * Motion:
 *  - Tilt: ±8° rotateX/rotateY, damped via `spring-smooth`, scoped to hover.
 *  - Float: ±8px sine loop, 6s (animation token `float-loop`).
 *  - Reduced motion: both disabled — renders fully static.
 *  - Touch devices: tilt is hover-scoped, so it never activates on touch.
 *
 * Responsive: four size presets scale across the `sm`/`md` breakpoints.
 *
 * Reusable: self-contained, no page integration. Drop in any transparent PNG
 * from /public and it just floats.
 */
export function Avatar({
    src,
    alt,
    size = "md",
    priority = false,
    float = true,
    tilt = true,
    className,
}: AvatarProps) {
    const reduced = useReducedMotion() === true;
    const enableFloat = float && !reduced;
    const enableTilt = tilt && !reduced;

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, TILT_SPRING);
    const springY = useSpring(rotateY, TILT_SPRING);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!enableTilt) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Normalize -1..1 relative to the element center, clamped to bounds.
        const nx = Math.max(
            -1,
            Math.min(1, (e.clientX - cx) / (rect.width / 2)),
        );
        const ny = Math.max(
            -1,
            Math.min(1, (e.clientY - cy) / (rect.height / 2)),
        );
        rotateY.set(nx * TILT_RANGE);
        rotateX.set(-ny * TILT_RANGE);
    };

    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn("relative [perspective:600px]", className)}
        >
            {/* Tilt layer — spring-damped rotateX/rotateY in 3D space. */}
            <motion.div
                style={{ rotateX: springX, rotateY: springY }}
                className="relative will-change-transform"
            >
                {/* Float layer — separate transform so it composes cleanly. */}
                <motion.div
                    animate={
                        enableFloat
                            ? { y: [0, -FLOAT_AMPLITUDE, 0] }
                            : undefined
                    }
                    transition={
                        enableFloat
                            ? {
                                  duration: FLOAT_DURATION,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                              }
                            : undefined
                    }
                >
                    {/* Sized box + soft drop-shadow contouring the PNG alpha. */}
                    <div
                        className={cn(
                            "relative drop-shadow-[0_16px_32px_rgba(0,0,0,0.12)]",
                            SIZE_PRESETS[size],
                        )}
                    >
                        <Image
                            src={src}
                            alt={alt}
                            fill
                            priority={priority}
                            sizes={SIZE_SOURCES[size]}
                            draggable={false}
                            className="pointer-events-none select-none object-contain"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

Avatar.displayName = "Avatar";
