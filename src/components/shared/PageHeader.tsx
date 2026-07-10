import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface PageHeaderProps {
    /** The mono eyebrow label, e.g. `// PROJECTS`. */
    eyebrow: string;
    /** The page `<h1>` text. */
    title: string;
    /** Optional mono command subtitle shown under the title (e.g. `docker ps`). */
    command?: ReactNode;
    /** Extra classes on the header element. */
    className?: string;
}

/**
 * PageHeader — the shared page header (component-inventory §shared).
 *
 * Renders the eyebrow → title → command-subtitle triplet used by every
 * content page (blog, projects, experience, skills, infrastructure, about,
 * contact). The markup was duplicated verbatim across those routes; this
 * component keeps the treatment identical and removes ~7 copies.
 *
 * The eyebrow is a mono uppercase tracked label, the title is the LCP `<h1>`,
 * and the optional command is a mono subtitle prefixed with a dimmed `$`.
 *
 * A Server Component — pure presentational markup, no interactivity.
 */
export function PageHeader({
    eyebrow,
    title,
    command,
    className,
}: PageHeaderProps) {
    return (
        <header className={cn("w-full max-w-3xl", className)}>
            <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                {eyebrow}
            </p>
            <h1 className="mt-2 text-h1 font-bold tracking-tight text-text-primary">
                {title}
            </h1>
            {command ? (
                <p className="mt-3 font-mono text-sm text-text-secondary">
                    <span className="text-text-tertiary">$</span>{" "}
                    <span className="text-text-secondary">{command}</span>
                </p>
            ) : null}
        </header>
    );
}

PageHeader.displayName = "PageHeader";
