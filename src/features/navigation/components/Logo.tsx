import Link from "next/link";

import { ROUTES, SITE } from "@utils/constants";
import { cn } from "@utils/cn";

interface LogoProps {
    /** Shrinks the mark for the navbar's scrolled state. */
    scrolled?: boolean;
    /** When true the wordmark is always visible (used in the mobile menu header). */
    alwaysShowWordmark?: boolean;
    /** When true the logo renders in its active (Home) state — the accent pill
     *  + indicator dot used by the navbar scroll-spy to mark the Hero section
     *  (`∞ root@kandarp` represents Home). */
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
 * hero is in view) it renders the same accent pill + indicator dot treatment
 * as the active nav links, so the `∞ root@kandarp` mark is the active
 * "Home" tab.
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
        <Link
            href={ROUTES.home}
            aria-label={`${name} — home`}
            aria-current={active ? "true" : undefined}
            className={cn(
                "group relative inline-flex items-center gap-2 rounded-md",
                "transition-colors duration-fast ease-standard",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                active && "bg-accent-subtle",
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "inline-block select-none bg-accent-gradient bg-clip-text font-mono font-bold leading-none text-transparent shadow-glow-sm",
                    "transition-transform duration-slow ease-smooth group-hover:rotate-[12deg]",
                    scrolled ? "text-xl" : "text-2xl",
                )}
            >
                ∞
            </span>
            <span
                className={cn(
                    "font-mono text-sm font-medium tracking-tight text-text-primary",
                    alwaysShowWordmark ? "inline" : "hidden md:inline",
                )}
            >
                {host}
            </span>
            {active ? (
                <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-warm-orange shadow-warm-glow-sm"
                />
            ) : null}
        </Link>
    );
}

Logo.displayName = "Logo";
