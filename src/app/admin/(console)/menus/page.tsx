"use client";

/**
 * Menus page — a hub for all navigational menus on the public site.
 *
 * The site has two built-in menu locations: the primary navigation
 * (settings.navigation) and the footer (settings.footer.columns). This
 * page surfaces both as editable "menu locations" with quick stats and
 * deep-links into their dedicated editors. It also renders a live
 * preview of each menu's link tree.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
    Navigation as NavIcon,
    PanelBottom,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { NavItem, Settings } from "@/lib/admin/types";

interface MenuLocation {
    key: string;
    label: string;
    description: string;
    href: string;
    icon: typeof NavIcon;
    items: { label: string; href: string; external: boolean; visible: boolean }[];
}

export default function AdminMenusPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => setSettings(s))
            .catch(() => setError("Failed to load menus."))
            .finally(() => setLoading(false));
    }, []);

    const locations: MenuLocation[] = settings
        ? [
            {
                key: "primary",
                label: "Primary Navigation",
                description:
                    "The main menu in the site header. Shown on every page.",
                href: "/admin/navigation",
                icon: NavIcon,
                items: (settings.navigation ?? []).map(
                    (n: NavItem) => ({
                        label: n.label,
                        href: n.href,
                        external: n.external,
                        visible: n.visible,
                    }),
                ),
            },
            {
                key: "footer",
                label: "Footer Menu",
                description:
                    "The link columns in the site footer, plus the copyright line.",
                href: "/admin/footer",
                icon: PanelBottom,
                items: (settings.footer?.columns ?? []).flatMap(
                    (col) =>
                        col.links?.map((l) => ({
                            label: `${col.title} › ${l.label}`,
                            href: l.href,
                            external: l.external,
                            visible: true,
                        })) ?? [],
                ),
            },
        ]
        : [];

    return (
        <>
            <AdminPageHeader
                title="Menus"
                description="Manage every navigational menu location on the public site."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {locations.map((loc) => {
                        const Icon = loc.icon;
                        const visibleCount = loc.items.filter(
                            (i) => i.visible,
                        ).length;
                        return (
                            <div
                                key={loc.key}
                                className="admin-glass flex flex-col rounded-xl p-5"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                                {loc.label}
                                            </h2>
                                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                                                {loc.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={loc.href}
                                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent-solid)] hover:bg-[var(--overlay-hover)]"
                                    >
                                        Edit
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </div>

                                <div className="mb-3 flex gap-4 text-xs text-[var(--text-tertiary)]">
                                    <span>
                                        {loc.items.length} links
                                    </span>
                                    <span>{visibleCount} visible</span>
                                    <span>
                                        {loc.items.length - visibleCount} hidden
                                    </span>
                                </div>

                                <div className="flex-1 space-y-1 rounded-lg bg-[var(--canvas-sunken)] p-3">
                                    {loc.items.length === 0 ? (
                                        <p className="py-3 text-center text-xs text-[var(--text-quaternary)]">
                                            No links yet.
                                        </p>
                                    ) : (
                                        loc.items.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm"
                                            >
                                                {item.external ? (
                                                    <ExternalLink className="h-3 w-3 shrink-0 text-[var(--text-quaternary)]" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3 shrink-0 text-[var(--text-quaternary)]" />
                                                )}
                                                <span
                                                    className={
                                                        item.visible
                                                            ? "truncate text-[var(--text-secondary)]"
                                                            : "truncate text-[var(--text-quaternary)] line-through"
                                                    }
                                                >
                                                    {item.label}
                                                </span>
                                                <span className="ml-auto truncate text-xs text-[var(--text-quaternary)]">
                                                    {item.href}
                                                </span>
                                                {item.visible ? (
                                                    <Eye className="h-3 w-3 text-[var(--text-quaternary)]" />
                                                ) : (
                                                    <EyeOff className="h-3 w-3 text-[var(--text-quaternary)]" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
