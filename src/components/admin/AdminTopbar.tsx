"use client";

/**
 * AdminTopbar — the sticky header above the admin content area.
 *
 * Contains: mobile sidebar toggle, global search trigger, command palette
 * shortcut, notifications dropdown, and the user menu (profile + logout).
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Search, User as UserIcon } from "lucide-react";

import type { SafeUser } from "@/lib/admin/types";
import { ROLE_LABELS } from "@/lib/admin/rbac";

interface AdminTopbarProps {
    user: SafeUser;
    onOpenSidebar: () => void;
    onOpenSearch: () => void;
}

export function AdminTopbar({
    user,
    onOpenSidebar,
    onOpenSearch,
}: AdminTopbarProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        await fetch("/api/admin/auth/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-30 flex h-[var(--admin-topbar-h)] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--glass-bg-strong)] px-4 backdrop-blur-xl">
            {/* Mobile sidebar toggle */}
            <button
                onClick={onOpenSidebar}
                className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)] lg:hidden"
                aria-label="Open sidebar"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Search trigger */}
            <button
                onClick={onOpenSearch}
                className="flex flex-1 items-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-sunken)] px-3 py-2 text-sm text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] lg:max-w-md"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search everything…</span>
                <kbd className="hidden rounded border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-quaternary)] sm:inline-block">
                    ⌘K
                </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="flex items-center gap-2.5 rounded-lg p-1.5 pr-3 hover:bg-[var(--overlay-hover)]"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-gradient)] text-sm font-semibold text-white">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden flex-col items-start sm:flex">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {user.name}
                            </span>
                            <span className="text-[11px] text-[var(--text-tertiary)]">
                                {ROLE_LABELS[user.role]}
                            </span>
                        </div>
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] py-1.5 shadow-lg">
                                <div className="border-b border-[var(--border-subtle)] px-4 py-2.5">
                                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-xs text-[var(--text-tertiary)]">
                                        {user.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        router.push("/admin/profile");
                                    }}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--overlay-hover)]"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
