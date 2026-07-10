"use client";

/**
 * SEO page — edit global search-engine-optimization metadata.
 *
 * The global SEO block lives on the Settings singleton
 * (`settings.globalSeo`). This page edits title, description, keywords,
 * canonical URL, OG/Twitter card fields, noindex, and JSON-LD, then
 * PATCHes `globalSeo` back via /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { SeoMeta, Settings } from "@/lib/admin/types";

export default function AdminSeoPage() {
    const [seo, setSeo] = useState<SeoMeta | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [keywordsText, setKeywordsText] = useState("");

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => {
                setSeo(s.globalSeo ?? {});
                setKeywordsText((s.globalSeo?.keywords ?? []).join(", "));
            })
            .catch(() => setError("Failed to load SEO settings."))
            .finally(() => setLoading(false));
    }, []);

    const patch = (p: Partial<SeoMeta>) =>
        setSeo((prev) => (prev ? { ...prev, ...p } : prev));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!seo) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        const payload: SeoMeta = {
            ...seo,
            keywords: keywordsText
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean),
        };
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ globalSeo: payload }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save SEO settings.");
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
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
    const cardClass = "admin-glass rounded-xl p-6";

    if (loading || !seo) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="SEO"
                description="Global search-engine-optimization metadata for the public site."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    SEO settings saved successfully.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Basic meta ─────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Basic Metadata
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Meta Title</label>
                            <input
                                value={seo.title ?? ""}
                                onChange={(e) => patch({ title: e.target.value })}
                                placeholder="Kandarp OS — DevOps Engineer"
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>
                                Meta Description
                            </label>
                            <textarea
                                value={seo.description ?? ""}
                                onChange={(e) =>
                                    patch({ description: e.target.value })
                                }
                                rows={3}
                                placeholder="A short description shown in search results."
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>
                                Keywords (comma-separated)
                            </label>
                            <input
                                value={keywordsText}
                                onChange={(e) =>
                                    setKeywordsText(e.target.value)
                                }
                                placeholder="devops, kubernetes, terraform"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Canonical URL
                            </label>
                            <input
                                value={seo.canonicalUrl ?? ""}
                                onChange={(e) =>
                                    patch({ canonicalUrl: e.target.value })
                                }
                                placeholder="https://kandarp.dev"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Twitter Card</label>
                            <select
                                value={seo.twitterCard ?? "summary"}
                                onChange={(e) =>
                                    patch({
                                        twitterCard: e.target.value as
                                            | "summary"
                                            | "summary_large_image",
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="summary">Summary</option>
                                <option value="summary_large_image">
                                    Summary Large Image
                                </option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={seo.noindex ?? false}
                                onChange={(e) =>
                                    patch({ noindex: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-[var(--border-default)]"
                            />
                            <span>
                                <code className="text-[var(--accent-solid)]">
                                    noindex
                                </code>{" "}
                                — hide this site from search engines
                            </span>
                        </label>
                    </div>
                </div>

                {/* ── Open Graph ─────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Open Graph
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>OG Title</label>
                            <input
                                value={seo.ogTitle ?? ""}
                                onChange={(e) =>
                                    patch({ ogTitle: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>OG Image URL</label>
                            <input
                                value={seo.ogImage ?? ""}
                                onChange={(e) =>
                                    patch({ ogImage: e.target.value })
                                }
                                placeholder="/media/og.png"
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>
                                OG Description
                            </label>
                            <textarea
                                value={seo.ogDescription ?? ""}
                                onChange={(e) =>
                                    patch({ ogDescription: e.target.value })
                                }
                                rows={2}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* ── JSON-LD ────────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Structured Data (JSON-LD)
                    </h2>
                    <p className="mb-3 text-sm text-[var(--text-tertiary)]">
                        A JSON-LD object injected into the page head for rich
                        search results. Paste valid JSON.
                    </p>
                    <textarea
                        value={
                            seo.jsonLd
                                ? JSON.stringify(seo.jsonLd, null, 2)
                                : ""
                        }
                        onChange={(e) => {
                            try {
                                const parsed = e.target.value
                                    ? JSON.parse(e.target.value)
                                    : undefined;
                                patch({ jsonLd: parsed });
                            } catch {
                                // Keep raw text; don't crash on partial JSON.
                            }
                        }}
                        rows={10}
                        placeholder='{ "@context": "https://schema.org", … }'
                        className={`${inputClass} font-mono text-xs`}
                    />
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
                        Save SEO Settings
                    </button>
                </div>
            </form>
        </>
    );
}
