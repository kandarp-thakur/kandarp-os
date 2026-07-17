"use client";

/**
 * Navigation page — edit the public site's primary navigation.
 *
 * The nav items live on the Settings singleton (`settings.navigation`).
 * This page loads the settings, lets the admin add/remove/reorder nav
 * items (label, href, visible, external, icon), and PATCHes the whole
 * `navigation` array back via /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import {
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { NavItem, Settings } from "@/lib/admin/types";

function uid(): string {
    return `nav_${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdminNavigationPage() {
    const [items, setItems] = useState<NavItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => setItems(s.navigation ?? []))
            .catch(() => setError("Failed to load navigation."))
            .finally(() => setLoading(false));
    }, []);

    const move = (idx: number, dir: -1 | 1) => {
        setItems((prev) => {
            const target = idx + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            const a = next[idx];
            const b = next[target];
            if (a === undefined || b === undefined) return prev;
            next[idx] = b;
            next[target] = a;
            return next;
        });
    };

    const update = (id: string, patch: Partial<NavItem>) =>
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        );

    const remove = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    const add = () =>
        setItems((prev) => [
            ...prev,
            {
                id: uid(),
                label: "New Link",
                href: "/",
                visible: true,
                external: false,
                children: [],
            },
        ]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ navigation: items }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save navigation.");
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";

    return (
        <>
            <AdminPageHeader
                title="Navigation"
                description="Edit the primary navigation menu shown on the public site."
                actions={
                    <button
                        onClick={add}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <Plus className="h-4 w-4" />
                        Add Link
                    </button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Navigation saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {items.length === 0 && (
                        <div className="admin-glass rounded-xl p-8 text-center text-sm text-[var(--text-tertiary)]">
                            No navigation items yet. Click “Add Link” to create
                            one.
                        </div>
                    )}
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="admin-glass rounded-xl p-4"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(idx, -1)}
                                        disabled={idx === 0}
                                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-30"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(idx, 1)}
                                        disabled={idx === items.length - 1}
                                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-30"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                                <input
                                    value={item.label}
                                    onChange={(e) =>
                                        update(item.id, {
                                            label: e.target.value,
                                        })
                                    }
                                    placeholder="Label"
                                    className={`${inputClass} max-w-[200px]`}
                                />
                                <input
                                    value={item.href}
                                    onChange={(e) =>
                                        update(item.id, {
                                            href: e.target.value,
                                        })
                                    }
                                    placeholder="/path or https://…"
                                    className={`${inputClass} flex-1 min-w-[160px]`}
                                />
                                <input
                                    value={item.icon ?? ""}
                                    onChange={(e) =>
                                        update(item.id, {
                                            icon: e.target.value,
                                        })
                                    }
                                    placeholder="icon (optional)"
                                    className={`${inputClass} max-w-[140px]`}
                                />
                                <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={item.visible}
                                        onChange={(e) =>
                                            update(item.id, {
                                                visible: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    {item.visible ? (
                                        <Eye className="h-3.5 w-3.5" />
                                    ) : (
                                        <EyeOff className="h-3.5 w-3.5" />
                                    )}
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={item.external}
                                        onChange={(e) =>
                                            update(item.id, {
                                                external: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    External
                                </label>
                                <button
                                    type="button"
                                    onClick={() => remove(item.id)}
                                    className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Navigation
                        </button>
                    </div>
                </form>
            )}
        </>
    );
}
