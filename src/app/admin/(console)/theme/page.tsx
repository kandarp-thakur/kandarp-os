"use client";

/**
 * Theme & Branding page — focused editor for the visual identity settings.
 *
 * Surfaces brand colors, theme mode, typography, the full color palette, and
 * custom CSS/JS injection. All fields live on the singleton Settings object
 * and are saved via PATCH /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Settings } from "@/lib/admin/types";

const COLOR_TOKENS = [
    ["background", "Background"],
    ["surface", "Surface"],
    ["text", "Text"],
    ["textMuted", "Text Muted"],
    ["border", "Border"],
    ["success", "Success"],
    ["warning", "Warning"],
    ["error", "Error"],
] as const;

const FONT_PRESETS = [
    "Space Grotesk",
    "Inter",
    "JetBrains Mono",
    "Poppins",
    "Roboto",
    "Open Sans",
    "Fira Code",
    "Sora",
];

export default function AdminThemePage() {
    const [form, setForm] = useState<Settings | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => setForm(s))
            .catch(() => setError("Failed to load settings."));
    }, []);

    const patch = (p: Partial<Settings>) =>
        setForm((prev) => (prev ? { ...prev, ...p } : prev));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save settings.");
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

    if (!form) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="Theme & Branding"
                description="Customize your site's visual identity — colors, typography, and custom code."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Theme saved successfully.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Brand Identity ─────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Brand Identity
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={form.brand.primaryColor}
                                    onChange={(e) =>
                                        patch({
                                            brand: {
                                                ...form.brand,
                                                primaryColor: e.target.value,
                                            },
                                        })
                                    }
                                    className="h-10 w-12 shrink-0 rounded border border-[var(--border-default)] bg-transparent"
                                />
                                <input
                                    value={form.brand.primaryColor}
                                    onChange={(e) =>
                                        patch({
                                            brand: {
                                                ...form.brand,
                                                primaryColor: e.target.value,
                                            },
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="#6366f1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Accent Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={form.brand.accentColor}
                                    onChange={(e) =>
                                        patch({
                                            brand: {
                                                ...form.brand,
                                                accentColor: e.target.value,
                                            },
                                        })
                                    }
                                    className="h-10 w-12 shrink-0 rounded border border-[var(--border-default)] bg-transparent"
                                />
                                <input
                                    value={form.brand.accentColor}
                                    onChange={(e) =>
                                        patch({
                                            brand: {
                                                ...form.brand,
                                                accentColor: e.target.value,
                                            },
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="#22d3ee"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Tagline</label>
                            <input
                                value={form.brand.tagline}
                                onChange={(e) =>
                                    patch({
                                        brand: {
                                            ...form.brand,
                                            tagline: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="A short, punchy tagline"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>
                                Brand Description
                            </label>
                            <textarea
                                value={form.brand.description}
                                onChange={(e) =>
                                    patch({
                                        brand: {
                                            ...form.brand,
                                            description: e.target.value,
                                        },
                                    })
                                }
                                rows={3}
                                className={inputClass}
                                placeholder="A longer description of your brand or personal mission."
                            />
                        </div>
                    </div>
                </div>

                {/* ── Theme Mode ────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Theme Mode
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className={labelClass}>Appearance</label>
                            <select
                                value={form.theme}
                                onChange={(e) =>
                                    patch({
                                        theme: e.target.value as
                                            | "dark"
                                            | "light",
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Performance Mode
                            </label>
                            <select
                                value={form.performanceMode}
                                onChange={(e) =>
                                    patch({
                                        performanceMode: e.target.value as
                                            | "auto"
                                            | "high"
                                            | "eco",
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="auto">Auto</option>
                                <option value="high">High</option>
                                <option value="eco">Eco</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    checked={form.animationsEnabled}
                                    onChange={(e) =>
                                        patch({
                                            animationsEnabled: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                                />
                                Animations enabled
                            </label>
                        </div>
                    </div>
                </div>

                {/* ── Typography ────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Typography
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Heading Font</label>
                            <input
                                list="font-presets"
                                value={form.typography.headingFont}
                                onChange={(e) =>
                                    patch({
                                        typography: {
                                            ...form.typography,
                                            headingFont: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="Space Grotesk"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Body Font</label>
                            <input
                                list="font-presets"
                                value={form.typography.bodyFont}
                                onChange={(e) =>
                                    patch({
                                        typography: {
                                            ...form.typography,
                                            bodyFont: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="Inter"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Mono Font</label>
                            <input
                                list="font-presets"
                                value={form.typography.monoFont}
                                onChange={(e) =>
                                    patch({
                                        typography: {
                                            ...form.typography,
                                            monoFont: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="JetBrains Mono"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Base Size</label>
                            <input
                                value={form.typography.baseSize}
                                onChange={(e) =>
                                    patch({
                                        typography: {
                                            ...form.typography,
                                            baseSize: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="16px"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Scale Ratio</label>
                            <input
                                value={form.typography.scale}
                                onChange={(e) =>
                                    patch({
                                        typography: {
                                            ...form.typography,
                                            scale: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="1.25"
                            />
                        </div>
                    </div>
                    <datalist id="font-presets">
                        {FONT_PRESETS.map((f) => (
                            <option key={f} value={f} />
                        ))}
                    </datalist>
                </div>

                {/* ── Color Palette ─────────────────────────────────────── */}
                <div className={cardClass}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Color Palette
                        </h2>
                        <button
                            type="button"
                            onClick={() =>
                                patch({
                                    colors: {
                                        background: "#0a0a0f",
                                        surface: "#12121a",
                                        text: "#e5e7eb",
                                        textMuted: "#9ca3af",
                                        border: "#27272a",
                                        success: "#22c55e",
                                        warning: "#f59e0b",
                                        error: "#ef4444",
                                    },
                                })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--canvas-sunken)]"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset to defaults
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {COLOR_TOKENS.map(([key, label]) => (
                            <div key={key}>
                                <label className={labelClass}>{label}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={form.colors[key]}
                                        onChange={(e) =>
                                            patch({
                                                colors: {
                                                    ...form.colors,
                                                    [key]: e.target.value,
                                                },
                                            })
                                        }
                                        className="h-10 w-12 shrink-0 rounded border border-[var(--border-default)] bg-transparent"
                                    />
                                    <input
                                        value={form.colors[key]}
                                        onChange={(e) =>
                                            patch({
                                                colors: {
                                                    ...form.colors,
                                                    [key]: e.target.value,
                                                },
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Custom Code ───────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Custom Code Injection
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>
                                Custom CSS
                                <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">
                                    Injected into the public site {"<head>"}
                                </span>
                            </label>
                            <textarea
                                value={form.customCss}
                                onChange={(e) =>
                                    patch({ customCss: e.target.value })
                                }
                                rows={6}
                                className={`font-mono ${inputClass}`}
                                placeholder="/* :root { --accent-solid: #6366f1; } */"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Custom JavaScript
                                <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">
                                    Executed on the public site
                                </span>
                            </label>
                            <textarea
                                value={form.customJavaScript}
                                onChange={(e) =>
                                    patch({ customJavaScript: e.target.value })
                                }
                                rows={6}
                                className={`font-mono ${inputClass}`}
                                placeholder="// console.log('hello from custom JS');"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Head Scripts
                                <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">
                                    Raw HTML for analytics, meta tags, etc.
                                </span>
                            </label>
                            <textarea
                                value={form.customScripts}
                                onChange={(e) =>
                                    patch({ customScripts: e.target.value })
                                }
                                rows={4}
                                className={`font-mono ${inputClass}`}
                                placeholder={"<!-- script src tag here -->"}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Save ──────────────────────────────────────────────── */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-solid)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving…" : "Save Theme"}
                    </button>
                </div>
            </form>
        </>
    );
}
