"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type { BlogHeading } from "@packages/types/blog";

interface TableOfContentsProps {
    /** Headings auto-derived from the post body (§13.2). */
    headings: BlogHeading[];
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * The post table of contents — the entry's structure
 * (blog-page-design §13).
 *
 * Auto-generated from the post's H2/H3 headings. Sticky on desktop (left
 * column), a collapsible disclosure on mobile. The active section
 * highlights via scrollspy (IntersectionObserver, rootMargin top -40%) and
 * carries `aria-current="true"` (§21). Smooth-scrolls on click; instant jump
 * under reduced motion (§13.4).
 *
 * Hidden entirely when the post has fewer than 3 headings (§13.6) — the
 * parent renders `null` in that case, but this component also guards it.
 *
 * A Client Component because it owns scrollspy + disclosure state.
 */
export function TableOfContents({ headings, className }: TableOfContentsProps) {
    const prefersReducedMotion = useReducedMotion();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Scrollspy — highlight the topmost visible heading (§13.4).
    useEffect(() => {
        if (headings.length < 3) return;
        const ids = headings.map((h) => h.id);
        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the topmost intersecting heading.
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );
                if (visible[0]) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
        );
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 3) return null;

    const handleClick = (
        event: React.MouseEvent<HTMLAnchorElement>,
        id: string,
    ) => {
        // Prevent the browser's default jump so we control the scroll.
        event.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;
        if (prefersReducedMotion) {
            el.scrollIntoView();
        } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        history.replaceState(null, "", `#${id}`);
        setMobileOpen(false);
    };

    const list = (
        <nav
            aria-label="Table of contents"
            className={cn("text-sm", className)}
        >
            <p className="mb-2 font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                On this page
            </p>
            <div className="mb-3 border-b border-border-subtle" />
            <ul className="space-y-1.5">
                {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    return (
                        <li
                            key={heading.id}
                            className={heading.level === 3 ? "pl-4" : ""}
                        >
                            <a
                                href={`#${heading.id}`}
                                onClick={(e) => handleClick(e, heading.id)}
                                aria-current={isActive ? "true" : undefined}
                                className={cn(
                                    "block border-l-2 pl-2.5 font-mono transition-colors duration-fast ease-standard",
                                    heading.level === 3
                                        ? "text-text-tertiary"
                                        : "font-medium",
                                    isActive
                                        ? "border-l-accent-solid text-accent-solid"
                                        : "border-l-transparent text-text-secondary hover:text-accent-solid",
                                )}
                            >
                                {heading.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );

    return (
        <>
            {/* Desktop — sticky sidebar. */}
            <aside className="hidden lg:block">
                <div className="sticky top-24 max-h-[70vh] overflow-y-auto rounded-lg bg-glass-bg-subtle p-4 backdrop-blur-glass-subtle">
                    {list}
                </div>
            </aside>

            {/* Mobile — collapsible disclosure (§13.5). */}
            <div className="lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-expanded={mobileOpen}
                    className="flex w-full items-center justify-between rounded-lg bg-glass-bg-subtle px-4 py-2.5 font-mono text-sm text-text-tertiary backdrop-blur-glass-subtle transition-colors duration-fast ease-standard hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                    <span>On this page</span>
                    <span
                        className={cn(
                            "transition-transform duration-fast ease-standard",
                            mobileOpen && "rotate-180",
                        )}
                        aria-hidden="true"
                    >
                        ▼
                    </span>
                </button>
                {mobileOpen && (
                    <div className="mt-2 rounded-lg bg-glass-bg-subtle p-4 backdrop-blur-glass-subtle">
                        {list}
                    </div>
                )}
            </div>
        </>
    );
}

TableOfContents.displayName = "TableOfContents";
