"use client";

import { SECTIONS, SITE } from "@utils/constants";
import { navigateToTarget } from "@utils/navigation";
import { cn } from "@utils/cn";

interface LogoProps {
    /** Shrinks the mark for the navbar's scrolled state. */
    scrolled?: boolean;
    /** When true the wordmark is always visible (used in the mobile menu header). */
    alwaysShowWordmark?: boolean;
    /** When true the logo text is the active Home navigation label. */
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
 * The logo doubles as the **Home** navigation target. When `active` is true,
 * its text alone receives the same restrained cyan glow as active nav links.
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

    return (
        <a
            href={`#${SECTIONS.hero}`}
            onClick={(event) => {
                event.preventDefault();
                navigateToTarget(`#${SECTIONS.hero}`, SECTIONS.hero);
            }}
            aria-label={`${name} — home`}
            aria-current={active ? "true" : undefined}
            className={cn(
                "inline-flex items-center gap-2 px-2 py-1 [--nav-tone:var(--docker-blue)]",
                "transition-[color,text-shadow] duration-200 ease-out hover:text-white",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
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
                    "relative z-10 font-mono text-sm tracking-tight transition-[color,text-shadow] duration-200 ease-out",
                    active
                        ? "font-semibold text-[#38BDF8] [text-shadow:0_0_12px_rgba(56,189,248,.35)]"
                        : "font-medium text-[#AAB4C5] [text-shadow:none]",
                    alwaysShowWordmark ? "inline" : "hidden md:inline",
                )}
            >
                {host}
            </span>
        </a>
    );
}

Logo.displayName = "Logo";
