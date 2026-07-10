"use client";

import { scrollToSection } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import type { NavItem } from "@/data/navigation";
import { NavDropdown } from "@/components/navigation/NavDropdown";

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
 * Renders a horizontal row of pill-style links. All current entries are flat
 * direct anchor links that smooth-scroll to their section; items with
 * `children` (if any are added later) render as a
 * [`NavDropdown`](./NavDropdown.tsx). The active section (tracked by
 * scroll-spy in the parent, resolved by document position) gets an
 * accent-tinted background + accent text + a 4px accent dot indicator.
 */
export function NavList({ activeSection, items, className }: NavListProps) {
    return (
        <ul className={cn("hidden items-center gap-1 md:flex", className)}>
            {items.map((item) => {
                if (item.children && item.children.length > 0) {
                    return (
                        <NavDropdown
                            key={item.sectionId}
                            item={item}
                            activeSection={activeSection}
                        />
                    );
                }

                const active = activeSection === item.sectionId;
                const Icon = item.icon;
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
                    <li key={item.sectionId}>
                        <a
                            href={item.href}
                            aria-current={active ? "true" : undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection(item.sectionId);
                            }}
                            className={cn(
                                "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
                                "font-sans text-sm font-medium transition-colors duration-fast ease-standard",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                active
                                    ? "bg-accent-subtle text-accent-solid"
                                    : "text-text-secondary hover:bg-overlay-hover hover:text-text-primary",
                            )}
                        >
                            <Icon
                                className="h-3.5 w-3.5 md:hidden"
                                aria-hidden="true"
                            />
                            {label}
                            {active ? (
                                <span
                                    aria-hidden="true"
                                    className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-solid"
                                />
                            ) : null}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

NavList.displayName = "NavList";
