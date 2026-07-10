"use client";

/**
 * Footer page — edit the public site's footer.
 *
 * The footer config lives on the Settings singleton (`settings.footer`):
 * an array of link columns, a copyright string, and a show-socials
 * toggle. This page loads settings, lets the admin add/remove columns
 * and links within them, and PATCHes `footer` back via /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { FooterColumn, Settings } from "@/lib/admin/types";

function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdminFooterPage() {
    const [columns, setColumns] = useState<FooterColumn[]>([]);
    const [copyright, setCopyright] = useState("");
    const [showSocials, setShowSocials] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => {
                setColumns(s.footer?.columns ?? []);
                setCopyright(s.footer?.copyright ?? "");
                setShowSocials(s.footer?.showSocials ?? true);
            })
            .catch(() => setError("Failed to load footer."))
            .finally(() => setLoading(false));
    }, []);

    const moveColumn = (idx: number, dir: -1 | 1) =>
        setColumns((prev) => {
            const next = [...prev];
            const target = idx + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[idx], next[target]] = [next[target]!, next[idx]!];
            return next;
        });

    const updateColumn = (id: string, patch: Partial<FooterColumn>) =>
        setColumns((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        );

    const removeColumn = (id: string) =>
        setColumns((prev) => prev.filter((c) => c.id !== id));

    const addColumn = () =>
        setColumns((prev) => [
            ...prev,
            { id: uid("col"), title: "New Column", links: [] },
        ]);

    const addLink = (colId: string) =>
        setColumns((prev) =>
            prev.map((c) =>
                c.id === colId
                    ? {
                        ...c,
                        links: [
                            ...c.links,
                            {
                                id: uid("lnk"),
                                label: "New Link",
                                href: "/",
                                external: false,
                            },
                        ],
                    }
                    : c,
            ),
        );

    const updateLink = (
        colId: string,
        linkId: string,
        patch: Partial<FooterColumn["links"][number]>,
    ) =>
        setColumns((prev) =>
            prev.map((c) =>
                c.id === colId
                    ? {
                        ...c,
                        links: c.links.map((l) =>
                            l.id === linkId ? { ...l, ...patch } : l,
                        ),
                    }
                    : c,
            ),
        );

    const removeLink = (colId: string, linkId: string) =>
        setColumns((prev) =>
            prev.map((c) =>
                c.id === colId
                    ? { ...c, links: c.links.filter((l) => l.id !== linkId) }
                    : c,
            ),
        );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    footer: { columns, copyright, showSocials },
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save footer.");
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
                title="Footer"
                description="Edit the link columns, copyright, and socials in the site footer."
                actions={
                    <button
                        onClick={addColumn}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <Plus className="h-4 w-4" />
                        Add Column
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
                    Footer saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {columns.map((col, idx) => (
                            <div
                                key={col.id}
                                className="admin-glass rounded-xl p-4"
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => moveColumn(idx, -1)}
                                            disabled={idx === 0}
                                            className="rounded p-0.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-30"
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveColumn(idx, 1)}
                                            disabled={idx === columns.length - 1}
                                            className="rounded p-0.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-30"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        value={col.title}
                                        onChange={(e) =>
                                            updateColumn(col.id, {
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="Column title"
                                        className={`${inputClass} font-medium`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeColumn(col.id)}
                                        className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {col.links.map((link) => (
                                        <div
                                            key={link.id}
                                            className="flex items-center gap-2"
                                        >
                                            <input
                                                value={link.label}
                                                onChange={(e) =>
                                                    updateLink(col.id, link.id, {
                                                        label: e.target.value,
                                                    })
                                                }
                                                placeholder="Label"
                                                className={`${inputClass} flex-1`}
                                            />
                                            <input
                                                value={link.href}
                                                onChange={(e) =>
                                                    updateLink(col.id, link.id, {
                                                        href: e.target.value,
                                                    })
                                                }
                                                placeholder="/path"
                                                className={`${inputClass} flex-1`}
                                            />
                                            <label className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                                <input
                                                    type="checkbox"
                                                    checked={link.external}
                                                    onChange={(e) =>
                                                        updateLink(
                                                            col.id,
                                                            link.id,
                                                            {
                                                                external:
                                                                    e.target
                                                                        .checked,
                                                            },
                                                        )
                                                    }
                                                    className="h-3.5 w-3.5 rounded border-[var(--border-default)]"
                                                />
                                                Ext
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeLink(col.id, link.id)
                                                }
                                                className="rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addLink(col.id)}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-default)] py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Footer-wide settings ─────────────────────────────── */}
                    <div className="admin-glass rounded-xl p-5">
                        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                            Footer Settings
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                                    Copyright Text
                                </label>
                                <input
                                    value={copyright}
                                    onChange={(e) =>
                                        setCopyright(e.target.value)
                                    }
                                    placeholder="© 2026 Kandarp Kumar Thakur. All rights reserved."
                                    className={inputClass}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    checked={showSocials}
                                    onChange={(e) =>
                                        setShowSocials(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-[var(--border-default)]"
                                />
                                Show social links in footer
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
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
                            Save Footer
                        </button>
                    </div>
                </form>
            )}
        </>
    );
}
