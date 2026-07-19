"use client";

/**
 * AdminSidebar — the primary navigation rail.
 *
 * A fixed, glass sidebar with grouped nav sections. Collapsible to an
 * icon-only rail on smaller screens. Highlights the active route and
 * filters items by the current user's permissions.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) =>
        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
                        return (
                            <div key={section.label} className="mb-5">
                                {!collapsed && (
                                    <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                        {section.label}
                                    </p>
                                )}
                                <ul className="space-y-0.5">
                                    {visibleItems.map((item) => {
                                        const active = isActive(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    title={
                                                        collapsed
                                                            ? item.label
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
