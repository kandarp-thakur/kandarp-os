"use client";

import { motion, useReducedMotion } from "framer-motion";

import { scrollToSection } from "@utils/navigation";
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
 * Renders a horizontal row of pill-style links. All current entries are flat
 * direct anchor links that smooth-scroll to their section; items with
 * `children` (if any are added later) render as a
 * [`NavDropdown`](./NavDropdown.tsx). The active section (tracked by
 * scroll-spy in the parent, resolved by document position) gets a shared
 * glass pill in its original section accent that animates between targets.
 */
export function NavList({ activeSection, items, className }: NavListProps) {
    const reduced = useReducedMotion() === true;

    return (
        <ul className={cn("hidden items-center gap-1 md:flex", className)}>
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
                    <li
                        key={item.sectionId}
                        style={{ "--nav-tone": tone } as React.CSSProperties}
                    >
                        <a
                            href={item.href}
                            aria-current={active ? "true" : undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection(item.sectionId);
                            }}
                            className={cn(
                                "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                                "font-sans text-sm font-medium transition-all duration-[250ms] ease-standard",
                                "hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--nav-tone)_8%,transparent)] hover:text-[var(--nav-tone)] hover:shadow-[0_0_14px_color-mix(in_srgb,var(--nav-tone)_12%,transparent)]",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                active
                                    ? "text-[var(--nav-tone)]"
                                    : "text-text-tertiary",
                            )}
                        >
                            {active ? (
                                <motion.span
                                    layoutId="primary-nav-active-pill"
                                    aria-hidden="true"
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.25,
                                                  ease: [0.4, 0, 0.2, 1],
                                              }
                                    }
                                    className="absolute inset-0 rounded-lg bg-[color-mix(in_srgb,var(--nav-tone)_12%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--nav-tone)_25%,transparent),0_0_18px_color-mix(in_srgb,var(--nav-tone)_15%,transparent)]"
                                />
                            ) : null}
                            <Icon
                                className="relative z-10 h-3.5 w-3.5 md:hidden"
                                aria-hidden="true"
                            />
                            <span className="relative z-10">{label}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

NavList.displayName = "NavList";
