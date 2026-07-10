import Link from "next/link";

import { ROUTES, SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

interface LogoProps {
    /** Shrinks the mark for the navbar's scrolled state. */
    scrolled?: boolean;
    /** When true the wordmark is always visible (used in the mobile menu header). */
    alwaysShowWordmark?: boolean;
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
 */
export function Logo({
    scrolled = false,
    alwaysShowWordmark = false,
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
            className={cn(
                "group inline-flex items-center gap-2 rounded-md",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
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
        </Link>
    );
}

Logo.displayName = "Logo";
