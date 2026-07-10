"use client";

import { useRef } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    type Variants,
} from "framer-motion";
import { ArrowRight, ArrowDown, Mail } from "lucide-react";

import { HeroBackground } from "@/components/sections/HeroBackground";
import { HeroTerminal } from "@/components/sections/HeroTerminal";
import { HeroPortrait } from "@/components/sections/HeroPortrait";
import { HeroScrollIndicator } from "@/components/sections/HeroScrollIndicator";
import { HERO_MOTION, HERO_BOOT_BANNER, HERO_BOOT_STATUS } from "@/data/hero";
import { SECTIONS, SITE } from "@/utils/constants";
import { scrollToSection } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import type { PublicImage } from "@/lib/admin/public-data";

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
    /**
     * Resolved profile image descriptor (from `getPublicHeroPortrait`). When
     * `null`, the hero renders the monogram placeholder. The image is
     * eager-loaded (priority) because it is above-the-fold LCP content.
     */
    heroPortrait?: PublicImage | null;
    /** CMS-driven owner name (falls back to the hardcoded default). */
    ownerName?: string;
    /** CMS-driven user@host string (falls back to SITE.userAtHost). */
    userAtHost?: string;
    /** CMS-driven resume URL (falls back to "/resume.pdf"). */
    resumeUrl?: string;
}

export function HeroSection({
    heroPortrait,
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
    const firstName =
        spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
    const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";
    const reduced = useReducedMotion() === true;
    const ref = useRef<HTMLElement>(null);

    // One scroll listener for the whole hero; children consume `progress`.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    return (
        <section
            ref={ref}
            className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 pb-24 pt-16 sm:px-6 lg:gap-16"
        >
            {/* Background placeholder — static layer until the 3D constellation lands. */}
            <HeroBackground />

            <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
                {/* Content column (7/12) */}
                <div className="flex flex-col items-start gap-6 lg:col-span-7">
                    {/* Boot banner — the OS welcome line */}
                    <motion.div
                        className="flex flex-col gap-1"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        animate={reduced ? undefined : "visible"}
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
                        className="font-sans text-5xl font-extrabold leading-[1.05] tracking-tight text-text-primary sm:text-6xl lg:text-7xl xl:text-[4.5rem]"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        animate={reduced ? undefined : "visible"}
                        custom={HERO_MOTION.delay.name}
                    >
                        <span className="bg-accent-gradient text-gradient">
                            {firstName}
                        </span>
                        {lastName && (
                            <>
                                {" "}
                                <span>{lastName}</span>
                            </>
                        )}
                    </motion.h1>

                    {/* Terminal */}
                    <motion.div
                        className="w-full"
                        variants={reduced ? undefined : fadeUp}
                        initial={reduced ? false : "hidden"}
                        animate={reduced ? undefined : "visible"}
                        custom={HERO_MOTION.delay.terminal}
                    >
                        <HeroTerminal />
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
                        variants={reduced ? undefined : containerStagger}
                        initial={reduced ? false : "hidden"}
                        animate={reduced ? undefined : "visible"}
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

                {/* Portrait column (5/12) */}
                <div className="flex justify-center lg:col-span-5 lg:justify-end">
                    <HeroPortrait
                        scrollProgress={scrollYProgress}
                        image={heroPortrait}
                    />
                </div>
            </div>

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
        "bg-accent-gradient text-white shadow-glow-sm hover:shadow-glow-md hover:brightness-110",
        variant === "glass" &&
        "glass-surface text-text-primary hover:shadow-glass-hover",
        variant === "ghost" &&
        "text-text-secondary hover:bg-accent-subtle hover:text-accent-solid",
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
