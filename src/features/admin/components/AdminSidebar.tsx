"use client";

/**
 * AdminSidebar — the primary navigation rail.
 *
 * A fixed, glass sidebar with grouped nav sections. Collapsible to an
 * icon-only rail on smaller screens. Highlights the active route and
 * filters items by the current user's permissions.
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import { ADMIN_NAV, type NavItem } from "@features/admin/components/nav-config";
import { cn } from "@utils/cn";

interface AdminSidebarProps {
    /** The current user's permissions (role-derived). */
    permissions: string[];
    /** Mobile open state — controlled by the topbar hamburger. */
    mobileOpen: boolean;
    onCloseMobile: () => void;
}

/** Does the user have the permission required for this nav item? */
function canSee(item: NavItem, permissions: string[]): boolean {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
}

export function AdminSidebar({
    permissions,
    mobileOpen,
    onCloseMobile,
}: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [collapsed, setCollapsed] = useState(false);
    const [closedSections, setClosedSections] = useState<Set<string>>(
        () =>
            new Set(
                ADMIN_NAV.filter(
                    (section) => section.label !== "Dashboard",
                ).map((section) => section.label),
            ),
    );

    const currentView = searchParams.get("view");
    const isActive = (href: string) => {
        const [itemPath, query] = href.split("?");
        const itemView = new URLSearchParams(query ?? "").get("view");
        const pathMatches =
            itemPath === "/admin"
                ? pathname === "/admin"
                : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

        return (
            pathMatches && (itemView ? currentView === itemView : !currentView)
        );
    };

    const toggleSection = (label: string) => {
        setClosedSections((current) => {
            const next = new Set(current);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };

    return (
        <>
            {/* Mobile scrim */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-[var(--scrim)] lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col admin-glass-strong transition-all duration-300",
                    "lg:translate-x-0",
                    mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                    collapsed
                        ? "w-[var(--admin-sidebar-w-collapsed)]"
                        : "w-[var(--admin-sidebar-w)]",
                )}
            >
                {/* Brand header */}
                <div className="flex h-[var(--admin-topbar-h)] items-center gap-3 border-b border-[var(--border-subtle)] px-4">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2.5 overflow-hidden"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-gradient)] text-sm font-bold text-white">
                            K
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    Kandarp OS
                                </span>
                                <span className="truncate text-[11px] text-[var(--text-tertiary)]">
                                    Engineering Console
                                </span>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={onCloseMobile}
                        className="ml-auto rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav sections */}
                <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-4">
                    {ADMIN_NAV.map((section) => {
                        const visibleItems = section.items.filter((item) =>
                            canSee(item, permissions),
                        );
                        if (visibleItems.length === 0) return null;

                        const hasActiveItem = visibleItems.some((item) =>
                            isActive(item.href),
                        );
                        const sectionOpen =
                            collapsed ||
                            hasActiveItem ||
                            !closedSections.has(section.label);

                        return (
                            <div key={section.label} className="mb-3">
                                {!collapsed && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleSection(section.label)
                                        }
                                        aria-expanded={sectionOpen}
                                        className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)] transition-colors hover:bg-[var(--overlay-hover)] hover:text-[var(--text-secondary)]"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="text-sm leading-none"
                                        >
                                            {section.marker}
                                        </span>
                                        <span className="flex-1 text-left">
                                            {section.label}
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                "h-3.5 w-3.5 transition-transform",
                                                !sectionOpen && "-rotate-90",
                                            )}
                                        />
                                    </button>
                                )}
                                <ul
                                    className={cn(
                                        "space-y-0.5",
                                        !sectionOpen && "hidden",
                                    )}
                                >
                                    {visibleItems.map((item) => {
                                        const active = isActive(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <li
                                                key={`${section.label}-${item.href}`}
                                            >
                                                <Link
                                                    href={item.href}
                                                    onClick={onCloseMobile}
                                                    title={
                                                        collapsed
                                                            ? item.label
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        "group flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                        active
                                                            ? "bg-[var(--accent-subtle)] text-[var(--accent-solid)]"
                                                            : "text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)] hover:text-[var(--text-primary)]",
                                                        collapsed &&
                                                            "justify-center",
                                                    )}
                                                >
                                                    <Icon className="h-[18px] w-[18px] shrink-0" />
                                                    {!collapsed && (
                                                        <span className="truncate">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle (desktop only) */}
                <div className="hidden border-t border-[var(--border-subtle)] p-2 lg:block">
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4" />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
