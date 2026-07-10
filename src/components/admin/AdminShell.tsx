"use client";

/**
 * AdminShell — the client-side console shell.
 *
 * Wraps the sidebar + topbar + command palette around the page content.
 * Manages the mobile sidebar open/close state and the ⌘K command palette.
 * The server layout passes the current user + permissions so the sidebar
 * can filter nav items by role.
 */

import { useEffect, useState, type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import type { SafeUser } from "@/lib/admin/types";
import { ROLE_PERMISSIONS } from "@/lib/admin/rbac";

interface AdminShellProps {
    user: SafeUser;
    children: ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);

    // ⌘K / Ctrl+K to open the command palette.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const permissions = ROLE_PERMISSIONS[user.role] ?? [];

    return (
        <div className="min-h-screen">
            <AdminSidebar
                permissions={permissions}
                mobileOpen={sidebarOpen}
                onCloseMobile={() => setSidebarOpen(false)}
            />

            {/* Content area — offset by the sidebar width on desktop */}
            <div className="lg:pl-[var(--admin-sidebar-w)]">
                <AdminTopbar
                    user={user}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenSearch={() => setPaletteOpen(true)}
                />

                <main className="mx-auto w-full max-w-[var(--admin-content-max)] px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>

            <AdminCommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
            />
        </div>
    );
}
