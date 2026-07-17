"use client";

import { useRef } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
    type Variants,
} from "framer-motion";
import { ArrowRight, ArrowDown, Mail } from "lucide-react";

import { HeroBackground } from "@/components/sections/HeroBackground";
import { HeroTerminal } from "@/components/sections/HeroTerminal";
import { HeroScrollIndicator } from "@/components/sections/HeroScrollIndicator";
import { HeroPortrait } from "@/features/hero/components/HeroPortrait";
import { HERO_MOTION, HERO_BOOT_BANNER, HERO_BOOT_STATUS } from "@/data/hero";
import { SECTIONS, SITE } from "@/utils/constants";
import { scrollToSection } from "@/utils/navigation";
import { cn } from "@/utils/cn";

/** Default split name for the gradient-on-first-word treatment (hero-design §2). */
const DEFAULT_FIRST_NAME = "KANDARP";
const DEFAULT_LAST_NAME = "KUMAR THAKUR";

/**
 * Hero section (hero-design §1–§8).
 *
 * Orchestrates the full hero: boot banner → name → terminal → portrait →
 * buttons → scroll indicator. Owns the single `useScroll` listener whose
 * progress drives every scroll-exit transform (parallax + fade) across the
 * children.
 *
 * Layout: 7/5 asymmetric split on desktop (content-left, portrait-right),
 * collapsing to a single centered column on mobile. Vertically centered in the
 * viewport. Entrance is staggered per hero-design §7.1; exit is parallax + fade
 * per §8. Reduced motion renders everything statically with no transforms.
 */
interface HeroSectionProps {
    /** CMS-driven owner name (falls back to the hardcoded default). */
    ownerName?: string;
    /** CMS-driven user@host string (falls back to SITE.userAtHost). */
    userAtHost?: string;
    /** CMS-driven resume URL (falls back to "/resume.pdf"). */
    resumeUrl?: string;
}

export function HeroSection({
    ownerName,
    userAtHost,
    resumeUrl,
}: HeroSectionProps) {
    const prompt = userAtHost ?? SITE.userAtHost;
    const resumeHref = resumeUrl || "/resume.pdf";

    // Split the owner name for the gradient-on-first-word treatment. If the
    // CMS provides a name, split on the first space; otherwise use the
    // hardcoded default.
    const fullName = ownerName ?? `${DEFAULT_FIRST_NAME} ${DEFAULT_LAST_NAME}`;
    const spaceIdx = fullName.indexOf(" ");
    const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
    const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";
    const reduced = useReducedMotion() === true;
    const ref = useRef<HTMLElement>(null);

    // One scroll listener for the whole hero; children consume `progress`.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    // Parallax scroll-exit: content fades + lifts as user scrolls past hero
    const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);

    return (
        <section
            ref={ref}
            className={cn(
                // The Hero owns the stacking context (task §Position:
                // "Hero position: relative"). `overflow-hidden` clips the
                // portrait so it can NEVER cover the navbar, the whole page,
                // or other sections — everything stays inside the Hero
                // (task §Overflow). The portrait is anchored to the Hero
                // (not the viewport) via the right column below.
                "hero relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-center gap-10 overflow-hidden px-4 pb-24 pt-16 sm:px-6 lg:gap-16",
            )}
        >
            {/* Background placeholder — static layer until the 3D constellation
                lands. The animated DevOps Infinity Loop (CloudInfinityBackground)
                is mounted globally in layout.tsx as a fixed full-viewport
                canvas at z-index: 0, so it sits behind this hero content. */}
            <HeroBackground />

            {/* hero-grid — the two-column grid (task §Hero Grid). LEFT (45%)
                holds the name / terminal / buttons; RIGHT (55%) holds the
                DevOps Infinity Loop + portrait + ambient particles. The grid
                uses CSS Grid (NOT viewport positioning) with
                `grid-template-columns: 45% 55%` on desktop and collapses to a
                single column on mobile. `align-items: center` vertically
                centers both columns. z-30 keeps the content ABOVE the portrait
                (z-20) so the portrait never covers the text / terminal /
                buttons. The portrait lives INSIDE the right column (task
                §Structure: "The portrait belongs ONLY inside the right
                column"), so it is anchored to the column (position: relative),
                never to the viewport. */}
            <motion.div
                className="hero-grid grid w-full grid-cols-1 items-center gap-10 lg:gap-8 lg:z-30 lg:[grid-template-columns:45%_55%]"
                style={
                    reduced
                        ? undefined
                        : { opacity: contentOpacity, y: contentY }
                }
            >
                {/* hero-left — the content column (45% on desktop). Holds the
                    boot banner, name (LCP <h1>), terminal, and CTA buttons.
                    The portrait on the right never overlaps this column
                    (task §Responsive, §Final Goal). */}
                <div className="hero-left flex w-full flex-col items-start gap-6">
                    {/* Boot banner — the OS welcome line */}
                    <motion.div
                        className="flex flex-col gap-1"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        whileInView={reduced ? undefined : "visible"}
                        viewport={{ once: false, margin: "-100px" }}
                        custom={HERO_MOTION.delay.eyebrow}
                    >
                        <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                            {prompt}:~$
                        </p>
                        <p className="font-mono text-sm text-accent-solid">
                            {HERO_BOOT_BANNER}
                        </p>
                        <p className="font-mono text-2xs text-text-tertiary">
                            {HERO_BOOT_STATUS}
                        </p>
                    </motion.div>

                    {/* Name — the LCP <h1> */}
                    <motion.h1
                        className="font-sans text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-[4.5rem]"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        whileInView={reduced ? undefined : "visible"}
                        viewport={{ once: false, margin: "-100px" }}
                        custom={HERO_MOTION.delay.name}
                    >
                        <span className="text-accent-solid">{firstName}</span>
                        {lastName && (
                            <>
                                {" "}
                                <span className="text-text-primary">
                                    {lastName}
                                </span>
                            </>
                        )}
                    </motion.h1>

                    {/* Terminal */}
                    <motion.div
                        className="w-full"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        whileInView={reduced ? undefined : "visible"}
                        viewport={{ once: false, margin: "-100px" }}
                        custom={HERO_MOTION.delay.terminal}
                    >
                        <HeroTerminal userAtHost={prompt} />
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
                        variants={reduced ? undefined : containerStagger}
                        initial={reduced ? false : "hidden"}
                        whileInView={reduced ? undefined : "visible"}
                        viewport={{ once: false, margin: "-100px" }}
                        custom={HERO_MOTION.delay.buttons}
                    >
                        <HeroButton
                            onClick={() => scrollToSection(SECTIONS.containers)}
                            variant="primary"
                            icon={
                                <ArrowRight
                                    className="h-4 w-4"
                                    strokeWidth={2}
                                />
                            }
                        >
                            View Containers
                        </HeroButton>
                        <HeroButton
                            href={resumeHref}
                            variant="glass"
                            icon={
                                <ArrowDown
                                    className="h-4 w-4"
                                    strokeWidth={2}
                                />
                            }
                            external
                        >
                            System Profile
                        </HeroButton>
                        <HeroButton
                            onClick={() => scrollToSection(SECTIONS.ssh)}
                            variant="ghost"
                            icon={<Mail className="h-4 w-4" strokeWidth={2} />}
                        >
                            SSH Access
                        </HeroButton>
                    </motion.div>
                </div>

                {/* hero-right — the visual column (55% on desktop). Holds the
                    DevOps Infinity Loop (the global fixed CloudInfinityBackground
                    canvas, z-0, renders behind everything) and the portrait.
                    `position: relative` + `overflow: hidden` + flex-centered so
                    the portrait (position: absolute, anchored to THIS column)
                    sits on the right side, vertically centered, and never
                    escapes the column (task §Hero Right, §Portrait Position).
                    The portrait is a child of this column — NOT a direct child
                    of the Hero <section> — so it is anchored to the column, not
                    the viewport. On mobile the grid collapses to a single column
                    and the portrait re-enters normal flow below the hero text
                    (task §Mobile). */}
                <div className="hero-right relative flex w-full items-center justify-center overflow-hidden lg:min-h-[600px]">
                    {/* Portrait — a normal React component (never inside the
                        Canvas). Lives ONLY inside the right column (task
                        §Structure). Anchored to this column (position: absolute;
                        right: 8%; top: 50%; transform: translateY(-50%);
                        z-index: 20) so it sits on the right side, vertically
                        centered, with the DevOps Infinity Loop BEHIND it (the
                        global CloudInfinityBackground canvas is z-index: 0; the
                        portrait is z-index: 20). It never exceeds ~35% of the
                        Hero width and never leaves the column (overflow-hidden
                        clips it). On mobile it drops the absolute anchor and
                        re-enters normal flow below the hero text, centered. See
                        [`HeroPortrait`](../../features/hero/components/HeroPortrait.tsx). */}
                    <HeroPortrait />
                </div>
            </motion.div>

            {/* Scroll indicator — bottom center */}
            <HeroScrollIndicator
                scrollProgress={scrollYProgress}
                className="absolute bottom-6 left-1/2 -translate-x-1/2"
            />
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "glass" | "ghost";

interface HeroButtonProps {
    /** Anchor href for external links (e.g. resume PDF). */
    href?: string;
    /** Click handler for in-page anchor navigation. */
    onClick?: () => void;
    variant: ButtonVariant;
    icon: React.ReactNode;
    external?: boolean;
    children: React.ReactNode;
}

/** A single hero CTA button (hero-design §4). Three variants, one primary. */
function HeroButton({
    href,
    onClick,
    variant,
    icon,
    external,
    children,
}: HeroButtonProps) {
    const reduced = useReducedMotion() === true;
    const className = cn(
        "group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-sans text-sm font-medium transition-all duration-slow ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-base",
        variant === "primary" &&
            "bg-accent-solid text-white shadow-glow-sm hover:bg-accent-hover hover:shadow-warm-glow-md hover:-translate-y-0.5",
        variant === "glass" &&
            "glass-surface text-text-secondary hover:text-cyan hover:border-cyan/30 hover:shadow-glass-hover",
        variant === "ghost" &&
            "text-text-tertiary hover:text-accent-hover hover:bg-warm-subtle hover:shadow-warm-glow-sm",
    );

    const content = (
        <>
            <span>{children}</span>
            <span
                className={cn(
                    "transition-transform duration-slow ease-smooth",
                    "group-hover:translate-x-0.5",
                )}
            >
                {icon}
            </span>
        </>
    );

    if (external && href) {
        return (
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                variants={reduced ? undefined : buttonItem}
            >
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={className}
            variants={reduced ? undefined : buttonItem}
        >
            {content}
        </motion.button>
    );
}

/* -------------------------------------------------------------------------- */
/* Motion variants                                                           */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay,
            duration: 0.48,
            ease: [0, 0, 0.2, 1],
        },
    }),
};

const containerStagger: Variants = {
    hidden: {},
    visible: (delay: number) => ({
        transition: {
            delayChildren: delay,
            staggerChildren: HERO_MOTION.delay.buttonStagger,
        },
    }),
};

const buttonItem: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: [0, 0, 0.2, 1] },
    },
};

HeroSection.displayName = "HeroSection";
