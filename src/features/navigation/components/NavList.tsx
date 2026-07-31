"use client";

import type { CSSProperties } from "react";

import { isSectionHref, navigateToTarget } from "@utils/navigation";
import { cn } from "@utils/cn";
import type { NavItem } from "@/data/navigation";
import { NavDropdown } from "@features/navigation/components/NavDropdown";

const NAV_TONES: Record<string, string> = {
    whoami: "#22D3EE",
    deployments: "#34D399",
    containers: "#FB923C",
    infrastructure: "#F472B6",
    toolkit: "#22D3EE",
    achievements: "#FB923C",
    logs: "#F472B6",
    ssh: "#34D399",
};

interface NavListProps {
    /** The currently-active section id (from scroll-spy). */
    activeSection: string | null;
    /** The full set of nav items. */
    items: NavItem[];
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * Desktop navigation links — anchor-based smooth-scroll (navigation-design §5).
 *
 * Renders a horizontal row of text-only links. All current entries are flat
 * direct anchor links that smooth-scroll to their section; items with
 * `children` render as a [`NavDropdown`](./NavDropdown.tsx). The active
 * section is identified solely by cyan text, weight, and a restrained glow.
 */
export function NavList({ activeSection, items, className }: NavListProps) {
    return (
        <ul
            className={cn(
                "navbar-primary-links relative hidden items-center gap-[30px] md:flex xl:gap-[36px]",
                className,
            )}
        >
            {items.map((item) => {
                const tone = NAV_TONES[item.sectionId] ?? "var(--accent-solid)";

                if (item.children && item.children.length > 0) {
                    return (
                        <NavDropdown
                            key={item.sectionId}
                            item={item}
                            activeSection={activeSection}
                            tone={tone}
                        />
                    );
                }

                const active = activeSection === item.sectionId;
                const label =
                    item.shortLabel !== undefined ? (
                        <>
                            <span className="lg:hidden">{item.shortLabel}</span>
                            <span className="hidden lg:inline">
                                {item.label}
                            </span>
                        </>
                    ) : (
                        item.label
                    );

                return (
                    <li
                        key={item.sectionId}
                        data-nav-section={item.sectionId}
                        style={{ "--nav-tone": tone } as CSSProperties}
                    >
                        <a
                            href={item.href}
                            aria-current={active ? "true" : undefined}
                            onClick={(event) => {
                                if (!isSectionHref(item.href)) return;
                                event.preventDefault();
                                navigateToTarget(item.href, item.sectionId);
                            }}
                            className={cn(
                                "inline-flex items-center gap-1.5 py-1.5 no-underline",
                                "font-sans text-[15px] tracking-[0.2px] transition-[color,text-shadow] duration-200 ease-out",
                                "hover:text-white",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                active
                                    ? "font-semibold text-[#38BDF8] [text-shadow:0_0_12px_rgba(56,189,248,.35)]"
                                    : "font-medium text-[#AAB4C5] [text-shadow:none]",
                            )}
                        >
                            <span>{label}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

NavList.displayName = "NavList";
