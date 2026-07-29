"use client";

import { useEffect, useRef, useState } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
    type Variants,
} from "framer-motion";
import { ArrowRight, BarChart3, Github, Linkedin, Mail } from "lucide-react";

import { HeroBackground } from "@features/hero/components/HeroBackground";
import { HeroTerminal } from "@features/hero/components/HeroTerminal";
import { HeroScrollIndicator } from "@features/hero/components/HeroScrollIndicator";
import { HeroPortrait } from "@features/hero/components/HeroPortrait";
import { HERO_MOTION, HERO_BOOT_BANNER, HERO_BOOT_STATUS } from "@/data/hero";
import { SECTIONS, SITE } from "@utils/constants";
import { scrollToSection } from "@utils/navigation";
import { cn } from "@utils/cn";

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
    /** Optional CMS-driven resume URL. When absent, CTA scrolls to profile content. */
    resumeUrl?: string;
}

export function HeroSection({
    ownerName,
    userAtHost,
    resumeUrl,
}: HeroSectionProps) {
    const prompt = userAtHost ?? SITE.userAtHost;
    const resumeHref = resumeUrl?.trim();

    // Split the owner name for the gradient-on-first-word treatment. If the
    // CMS provides a name, split on the first space; otherwise use the
    // hardcoded default.
    const fullName = ownerName ?? `${DEFAULT_FIRST_NAME} ${DEFAULT_LAST_NAME}`;
    const spaceIdx = fullName.indexOf(" ");
    const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
    const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";
    const reduced = useReducedMotion() === true;
    const ref = useRef<HTMLElement>(null);

    // Hydration-safety gate. framer-motion's `useScroll`/`useTransform`
    // produce MotionValues whose initial inline style on the server
    // (`opacity:1;transform:none`) can differ from the client's first render
    // (the client may compute a non-zero transform from the scroll position
    // before the ref is measured). That single style mismatch on the hero's
    // `motion.div` triggers a hydration error, which in Next.js App Router
    // causes the ENTIRE page route segment to bail out to client-side
    // rendering — orphaning the streamed server HTML for every section after
    // the hero (they live in a hidden Suspense slot that never gets revealed).
    // By gating the MotionValue style behind `mounted`, the first client
    // render is identical to the server render (no transform), and the
    // parallax only engages after hydration completes.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // One scroll listener for the whole hero; children consume `progress`.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    // Parallax scroll-exit: keep the hero readable while the user is still in
    // the section. The old 0 → 0.5 fade could hide terminal/buttons on shorter
    // screens before the user had finished reading the hero content.
    const contentOpacity = useTransform(
        scrollYProgress,
        [0, 0.85, 1],
        [1, 1, 0],
    );
    const contentY = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, -40]);

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
                "hero relative isolate z-30 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col justify-center overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-12 lg:py-8",
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
                className="hero-grid relative z-40 grid w-full grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(500px,0.92fr)] xl:gap-10 lg:translate-y-2"
                style={
                    reduced || !mounted
                        ? { opacity: 1, y: 0 }
                        : { opacity: contentOpacity, y: contentY }
                }
            >
                {/* hero-left — the content column (45% on desktop). Holds the
                    boot banner, name (LCP <h1>), terminal, and CTA buttons.
                    The portrait on the right never overlaps this column
                    (task §Responsive, §Final Goal). */}
                <div className="hero-left visible relative z-50 flex w-full min-w-0 flex-col items-start gap-4 opacity-100">
                    {/* Boot banner — the OS welcome line */}
                    <motion.div
                        className="flex flex-col gap-1.5"
                        variants={undefined}
                        initial={false}
                        animate="visible"
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
                        className="visible max-w-[760px] font-sans text-[clamp(3.5rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-text-primary opacity-100"
                        variants={undefined}
                        initial={false}
                        animate="visible"
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

                    <div className="flex max-w-[520px] flex-col gap-4">
                        <p className="font-mono text-lg font-semibold tracking-[0.02em] text-accent-solid sm:text-xl">
                            DevOps Engineer
                        </p>
                        <p className="max-w-[520px] text-base leading-[1.7] text-text-secondary">
                            I build reliable cloud infrastructure, secure
                            networks, automated deployment pipelines, and
                            production-ready systems that keep teams shipping
                            safely.
                        </p>
                    </div>

                    <div
                        className="grid w-full max-w-[520px] grid-cols-1 gap-3 min-[420px]:grid-cols-3"
                        aria-label="Hero stats"
                    >
                        {HERO_STATS.map((stat) => (
                            <div
                                key={stat.label}
                                className="glass-surface flex h-[72px] flex-col justify-center rounded-lg px-[18px] py-3.5 text-left transition-all duration-slow ease-smooth hover:-translate-y-1 hover:border-accent-solid/30 hover:shadow-glow-sm"
                            >
                                <p className="font-mono text-lg font-bold text-text-primary">
                                    {stat.value}
                                </p>
                                <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Terminal */}
                    <motion.div
                        className="w-full max-w-[620px]"
                        variants={undefined}
                        initial={false}
                        animate="visible"
                        custom={HERO_MOTION.delay.terminal}
                    >
                        <HeroTerminal userAtHost={prompt} />
                    </motion.div>

                    {/* Buttons — fit content width on every breakpoint.
                        `items-start` prevents flex children from stretching
                        to the cross-axis width (the default `stretch`), so each
                        button keeps its intrinsic content width instead of
                        filling the column/row. On mobile the buttons stack
                        left-aligned (content width); on `sm`+ they flow in a
                        row and wrap when they exceed the column width. No
                        `w-full` here — that would force the container to the
                        full column width and, under `flex-col`, stretch every
                        button across the viewport (the reported bug). */}
                    <motion.div
                        className="flex w-full max-w-[620px] flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center"
                        variants={undefined}
                        initial={false}
                        animate="visible"
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
                            onClick={
                                resumeHref
                                    ? undefined
                                    : () => scrollToSection(SECTIONS.whoami)
                            }
                            variant="glass"
                            icon={
                                <BarChart3
                                    className="h-4 w-4"
                                    strokeWidth={2}
                                />
                            }
                            external={Boolean(resumeHref)}
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

                    <div
                        className="flex items-center gap-3"
                        aria-label="Social links"
                    >
                        {HERO_SOCIALS.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target={social.external ? "_blank" : undefined}
                                rel={
                                    social.external
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                aria-label={social.label}
                                className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors duration-slow hover:text-accent-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid"
                            >
                                <social.Icon
                                    className="h-4 w-4"
                                    strokeWidth={2}
                                />
                            </a>
                        ))}
                    </div>
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
                <div className="hero-right relative flex min-h-[320px] w-full items-center justify-center overflow-visible md:min-h-[420px] lg:min-h-0 lg:justify-end">
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
        "group inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 font-sans text-sm font-medium transition-all duration-slow ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-base hover:-translate-y-0.5",
        variant === "primary" &&
            "bg-accent-solid text-white shadow-glow-sm hover:bg-accent-hover hover:shadow-warm-glow-md hover:-translate-y-0.5",
        variant === "glass" &&
            "glass-surface text-text-secondary hover:border-cyan/30 hover:text-cyan hover:shadow-glass-hover",
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

    if (href) {
        return (
            <motion.a href={href} className={className} variants={undefined}>
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={className}
            variants={undefined}
        >
            {content}
        </motion.button>
    );
}

const HERO_STATS = [
    { label: "Cloud", value: "AWS" },
    { label: "Runtime", value: "Docker" },
    { label: "Automation", value: "Python" },
] as const;

const HERO_SOCIALS = [
    {
        label: "GitHub profile",
        href: "https://github.com/kandarp-thakur",
        external: true,
        Icon: Github,
    },
    {
        label: "LinkedIn profile",
        href: "https://www.linkedin.com/in/kandarp-kumar-thakur",
        external: true,
        Icon: Linkedin,
    },
    {
        label: "Email Kandarp",
        href: "mailto:kkthakur100101@gmail.com",
        external: false,
        Icon: Mail,
    },
] as const;

/* -------------------------------------------------------------------------- */
/* Motion variants                                                           */
/* -------------------------------------------------------------------------- */

const buttonItem: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: [0, 0, 0.2, 1] },
    },
};

HeroSection.displayName = "HeroSection";
