"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";

import { SITE } from "@/config/site";
import { cn } from "@/utils/cn";

/**
 * Intrinsic source dimensions of `/images/profile/portrait.webp`
 * (1092 × 903 — tightly cropped to the subject so the person fills the frame
 * with a clean transparent background, no large empty margins). Declared once
 * so the Next.js `Image` component can render with `width`/`height`
 * (intrinsic) and preserve the aspect ratio. The portrait is **never
 * stretched** (task §Size: "Maintain aspect ratio. Never stretch.") — only
 * the height OR width is bounded, whichever is the binding constraint, and
 * the other follows the aspect ratio.
 */
const PORTRAIT_WIDTH = 1092;
const PORTRAIT_HEIGHT = 903;

/** Idle float travel (px): 0 → -6 → 0 (task §Animation: "Idle floating 6px"). */
const FLOAT_DISTANCE = 6;
/** Idle float duration (s): 8s, infinite, easeInOut. */
const FLOAT_DURATION = 8;

/**
 * Mouse parallax cap (px): max 6px, "very subtle" (task §Animation:
 * "Mouse parallax — Very subtle"). Half the previous 10px so the portrait
 * barely drifts with the cursor and never reads as detached from the hero.
 */
const MOUSE_RANGE = 6;

export interface HeroPortraitProps {
    /**
     * Portrait image source. Defaults to `SITE.profileImage`
     * (`/images/profile/portrait.webp`) so the public path is never hardcoded
     * in the component. The Admin Panel Media Library can supply this later
     * without changing the component.
     */
    src?: string;
    /** Accessible alt text. Defaults to the site owner's name. */
    alt?: string;
    /** Extra classes on the host wrapper (escape hatch). */
    className?: string;
}

/**
 * HeroPortrait — the transparent portrait that lives **inside the Hero
 * section only** (task §Structure, §Overflow).
 *
 * This component ONLY renders the portrait. No business logic, no Three.js,
 * no Canvas (task §Component). It is a normal React component mounted inside
 * the hero's right column (`HeroRight`) — never inside the Canvas, never
 * outside the Hero.
 *
 * Positioning (task §Position):
 *  - **Desktop** — `position: absolute; right: 5%; top: 50%;
 *    transform: translateY(-50%); z-index: 20`. Anchored to the Hero
 *    <section> (position: relative + overflow-hidden), NOT the viewport and
 *    NOT a small inner column — so it sits on the RIGHT side, **vertically
 *    centered** inside the Hero (task §Position: "vertically centered inside
 *    the Hero. NOT attached to the bottom."), overlapping the DevOps Infinity
 *    Loop by ~15–20% with the loop **behind** it (the global
 *    `CloudInfinityBackground` canvas is `z-index: 0`; the portrait is
 *    `z-index: 20`). It is `pointer-events: none` so it never blocks the hero
 *    content / terminal / buttons (task §Final Result: "Hero text remains
 *    completely unobstructed").
 *  - **Tablet** — scales down (task §Responsive: "Portrait scales down").
 *  - **Mobile** — moves below the hero text, center-aligned (task §Responsive:
 *    "Portrait moves below the Hero content"). On mobile the absolute anchor
 *    is dropped so the portrait re-enters normal flow under the content.
 *
 * Size (task §Size):
 *  - Desktop height 650–750px (700px mid-range), width auto, aspect ratio
 *    preserved, never stretched. **Never exceeds 40% of the Hero width** and
 *    **never leaves the Hero container** — both `max-h` and `max-w-[40%]`
 *    bound the image so the landscape source (1150×928) can never balloon to
 *    ~967px wide and cover the hero content.
 *
 * Animation (task §Animation):
 *  - **Idle float** — `translateY 0 → -6px → 0`, 8s, infinite, easeInOut.
 *  - **Mouse parallax** — max 6px, very subtle, damped via a spring. Disabled
 *    on touch / coarse pointers and under reduced motion. **No fixed
 *    positioning** (task §Animation: "No fixed positioning").
 *
 * Styling: no card, no glass panel, no frame, no circular crop, no background —
 * only the transparent portrait. The portrait must have a transparent
 * background (the source WebP carries a real alpha channel).
 *
 * Reduced motion: fully static (no float, no parallax). Touch / coarse
 * pointers: mouse parallax disabled (idle float still runs).
 */
export function HeroPortrait({
    src,
    alt = "Kandarp Kumar Thakur",
    className,
}: HeroPortraitProps) {
    const reduced = useReducedMotion() === true;
    const portraitSrc = src ?? SITE.profileImage;

    // Mouse parallax (desktop / fine pointer only) — normalized -1..1, damped
    // via a spring so the motion is subtle, not jittery. Max ±6px (very
    // subtle, task §Animation).
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { stiffness: 60, damping: 18, mass: 0.6 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (reduced) return;
        if (typeof window === "undefined") return;
        // Coarse pointers (touch) get no mouse parallax — only the idle float.
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (!fine) return;
        const onMove = (e: MouseEvent) => {
            mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
            mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        return () => window.removeEventListener("mousemove", onMove);
    }, [reduced, mouseX, mouseY]);

    const translateX = useTransform(springX, (v) => v * MOUSE_RANGE);
    const translateY = useTransform(springY, (v) => v * MOUSE_RANGE);

    return (
        // Outer wrapper — owns the CSS positioning + vertical centering ONLY.
        // It is a PLAIN <div> (no framer-motion `style`/transform here) so the
        // Tailwind `-translate-y-1/2` centering transform is never clobbered
        // by the parallax `x`/`y` motion values, which live on the inner
        // motion.div (a separate element → its transform composes with this
        // one instead of overwriting it). Anchored to the Hero's RIGHT COLUMN
        // (`.hero-right`, position: relative + overflow-hidden), NOT the
        // viewport and NOT the whole Hero <section> (task §Position:
        // "Only position it relative to the Hero container"; §Structure:
        // "The portrait belongs ONLY inside the right column").
        // `pointer-events: none` so it never blocks the hero text / terminal /
        // buttons (task §Final Result: "Hero text remains completely
        // unobstructed"). `right-[8%] top-1/2 -translate-y-1/2 z-20` puts it on
        // the RIGHT side of the column, vertically centered, with the DevOps
        // Infinity Loop BEHIND it (the global CloudInfinityBackground canvas
        // is z-index: 0; the portrait is z-index: 20) (task §Portrait
        // Position: "right:8%; top:50%; transform:translateY(-50%);
        // z-index:20").
        <div
            aria-hidden="true"
            className={cn(
                "hero-portrait pointer-events-none absolute right-[8%] top-1/2 z-20 -translate-y-1/2",
                // Tablet: scale down (task §Responsive). Applied at the wrapper
                // so the whole portrait (image + float) scales together.
                // origin-right keeps the right edge fixed while scaling so the
                // portrait stays anchored to the right side as it shrinks
                // (it is vertically centered, so scaling from the right edge
                // preserves the centering).
                "md:scale-90 md:origin-right",
                // Mobile: drop the absolute anchor so the portrait re-enters
                // normal flow below the hero text, center-aligned (task
                // §Mobile: "Portrait moves below the Hero content. Centered.").
                // All absolute-positioning + centering transforms are reset so
                // nothing leaks into static flow (notably -translate-y-1/2,
                // which would otherwise shift a static element up by half its
                // height).
                "max-md:static max-md:right-auto max-md:top-auto max-md:translate-y-0 max-md:scale-100 max-md:z-auto max-md:mx-auto max-md:pt-8",
                className,
            )}
        >
            {/* Parallax layer — mouse parallax (±6px, very subtle, damped via
                a spring). Lives on a separate motion.div so its `x`/`y`
                transform composes with the outer wrapper's centering
                transform instead of overwriting it. Disabled under reduced
                motion. */}
            <motion.div
                style={
                    reduced
                        ? undefined
                        : {
                              x: translateX,
                              y: translateY,
                              willChange: "transform",
                          }
                }
            >
                {/* Idle float — a separate transform layer so it composes
                    cleanly with the mouse parallax above. 0 → -6px → 0, 8s. */}
                <motion.div
                    animate={
                        reduced ? undefined : { y: [0, -FLOAT_DISTANCE, 0] }
                    }
                    transition={
                        reduced
                            ? undefined
                            : {
                                  duration: FLOAT_DURATION,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                              }
                    }
                >
                    <Image
                        src={portraitSrc}
                        alt={alt}
                        width={PORTRAIT_WIDTH}
                        height={PORTRAIT_HEIGHT}
                        priority
                        sizes="(max-width: 768px) 70vw, (max-width: 1024px) 40vw, 32vw"
                        className={cn(
                            // Frameless, transparent portrait. No card, no
                            // frame, no circular crop, no background (task
                            // §Styling). The transparent WebP alpha shows the
                            // scene through it.
                            "block h-auto w-auto select-none",
                            // Desktop height 650–700px (task §Portrait Size:
                            // "Height 650–700px"), width auto, aspect ratio
                            // preserved (never stretched). The portrait now
                            // lives inside the Hero's RIGHT column (55% of the
                            // Hero width), so `max-w-[64%]` of the column ≈ 35%
                            // of the full Hero width (task §Portrait Size:
                            // "Maximum width 35% of the Hero"). The cropped
                            // source (1092×903, ~1.21:1) at 700px tall would be
                            // ~845px wide — so on standard viewports the
                            // column-relative max-w is the binding constraint
                            // and the height follows the aspect ratio. On
                            // ultrawide viewports max-h-[700px] becomes the
                            // binding constraint. Both bounds guarantee the
                            // portrait never exceeds ~35% of the Hero width AND
                            // never leaves the right column (overflow-hidden on
                            // `.hero-right` clips it) (task §Size, §Overflow,
                            // §Final Result: "Hero text remains completely
                            // unobstructed").
                            "max-h-[700px] max-w-[64%]",
                        )}
                        style={{
                            // Explicit visibility flags: display block,
                            // visible, opacity 1. No display:none, opacity:0,
                            // overflow:hidden, clip-path, mask, or
                            // mix-blend-mode anywhere on the portrait.
                            display: "block",
                            visibility: "visible",
                            opacity: 1,
                            objectFit: "contain",
                        }}
                        draggable={false}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

HeroPortrait.displayName = "HeroPortrait";
