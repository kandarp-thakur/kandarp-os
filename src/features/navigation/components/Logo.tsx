"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { ROUTES, SITE } from "@utils/constants";
import { cn } from "@utils/cn";

interface LogoProps {
    /** Shrinks the mark for the navbar's scrolled state. */
    scrolled?: boolean;
    /** When true the wordmark is always visible (used in the mobile menu header). */
    alwaysShowWordmark?: boolean;
    /** When true the logo renders in its active (Home) glass-pill state. */
    active?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** CMS-driven site name (falls back to SITE.name). */
    siteName?: string;
    /** CMS-driven user@host string (falls back to SITE.userAtHost). */
    userAtHost?: string;
}

/**
 * Logo: a terminal-prompt identity mark (navigation-design §4).
 *
 * The mark is the infinity glyph `∞` rendered in the accent gradient — it
 * reads as the "shell prompt" of the engineering OS and tilts slightly on
 * hover. The wordmark is the SSH-style `root@kandarp` host string set in the
 * mono font, so the whole logo reads as `∞ root@kandarp`. The wordmark shows
 * on `md`+ in the navbar and always inside the mobile menu. Clicking navigates
 * home.
 *
 * The logo doubles as the **Home** navigation target: it represents the Hero
 * section. When `active` is true (driven by the navbar scroll-spy when the
 * hero is in view) it renders the same blue glass pill as the active nav
 * links, so the `∞ root@kandarp` mark is the active "Home" tab.
 */
export function Logo({
    scrolled = false,
    alwaysShowWordmark = false,
    active = false,
    className,
    siteName,
    userAtHost,
}: LogoProps) {
    const name = siteName ?? SITE.name;
    const host = userAtHost ?? SITE.userAtHost;
    const reduced = useReducedMotion() === true;

    return (
        <Link
            href={ROUTES.home}
            aria-label={`${name} — home`}
            aria-current={active ? "true" : undefined}
            className={cn(
                "relative inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 [--nav-tone:var(--docker-blue)]",
                "transition-all duration-[250ms] ease-standard",
                "hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--nav-tone)_8%,transparent)] hover:shadow-[0_0_14px_color-mix(in_srgb,var(--nav-tone)_12%,transparent)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
            {active ? (
                <motion.span
                    layoutId="primary-nav-active-pill"
                    aria-hidden="true"
                    transition={
                        reduced
                            ? { duration: 0 }
                            : { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                    }
                    className="absolute inset-0 rounded-lg bg-[color-mix(in_srgb,var(--nav-tone)_12%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--nav-tone)_25%,transparent),0_0_18px_color-mix(in_srgb,var(--nav-tone)_15%,transparent)]"
                />
            ) : null}
            <span
                aria-hidden="true"
                className={cn(
                    "relative z-10 inline-block select-none bg-accent-gradient bg-clip-text font-mono font-bold leading-none text-transparent shadow-glow-sm",
                    scrolled ? "text-xl" : "text-2xl",
                )}
            >
                ∞
            </span>
            <span
                className={cn(
                    "relative z-10 font-mono text-sm font-medium tracking-tight transition-colors duration-[250ms]",
                    active ? "text-[var(--nav-tone)]" : "text-text-primary",
                    alwaysShowWordmark ? "inline" : "hidden md:inline",
                )}
            >
                {host}
            </span>
        </Link>
    );
}

Logo.displayName = "Logo";
