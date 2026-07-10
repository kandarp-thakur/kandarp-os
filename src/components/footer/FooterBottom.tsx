import { SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

interface FooterBottomProps {
    /** Extra classes (escape hatch). */
    className?: string;
    /** CMS-driven copyright text (falls back to "© YEAR OWNER. All rights reserved."). */
    copyright?: string;
    /** CMS-driven owner name (falls back to SITE.owner). */
    ownerName?: string;
    /** CMS-driven user@host string (falls back to SITE.userAtHost). */
    userAtHost?: string;
}

/** Current year, resolved at render. SSR-stable within a single request. */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * FooterBottom — the copyright + legal row at the base of the footer
 * (component-inventory §Navigation #13).
 *
 * Renders the owner name, the current year, and a terminal-style host
 * signature (`kandarp@portfolio-os`) consistent with the OS aesthetic. A
 * Server Component — static content, no interactivity. Accepts optional
 * CMS-driven values; falls back to the hardcoded SITE constants.
 */
export function FooterBottom({
    className,
    copyright,
    ownerName,
    userAtHost,
}: FooterBottomProps) {
    const owner = ownerName ?? SITE.owner;
    const host = userAtHost ?? SITE.userAtHost;
    const copyrightText =
        copyright ?? `© ${CURRENT_YEAR} ${owner}. All rights reserved.`;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between gap-2 sm:flex-row",
                className,
            )}
        >
            <p className="font-mono text-2xs text-text-tertiary">
                {copyrightText}
            </p>
            <p className="font-mono text-2xs text-text-quaternary">
                <span className="text-accent-solid">{host}</span>
                <span className="text-text-quaternary">:~$</span>{" "}
                <span className="text-text-tertiary">exit 0</span>
            </p>
        </div>
    );
}

FooterBottom.displayName = "FooterBottom";
