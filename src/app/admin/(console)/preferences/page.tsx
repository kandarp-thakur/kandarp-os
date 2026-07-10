"use client";

/**
 * Preferences page — personal + site-level display preferences.
 *
 * Two concerns:
 * 1. **Personal** — admin-console UI preferences (sidebar collapsed,
 *    density, command palette shortcut hint). Stored client-side in
 *    localStorage so each user keeps their own layout without a round
 *    trip.
 * 2. **Site-level** — animationsEnabled + performanceMode, which live on
 *    the Settings singleton and affect the public site. Saved via
 *    /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import {
    Gauge,
    Loader2,
    Monitor,
    Save,
    SlidersHorizontal,
    Sparkles,
    Zap,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Settings } from "@/lib/admin/types";

const STORAGE_KEY = "kandarp-os-admin-prefs";

interface PersonalPrefs {
    density: "comfortable" | "compact";
    defaultLanding: "dashboard" | "projects" | "blog";
    confirmDestructive: boolean;
}

const DEFAULT_PREFS: PersonalPrefs = {
    density: "comfortable",
    defaultLanding: "dashboard",
    confirmDestructive: true,
};

export default function AdminPreferencesPage() {
    const [prefs, setPrefs] = useState<PersonalPrefs>(DEFAULT_PREFS);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [performanceMode, setPerformanceMode] = useState<
        "auto" | "high" | "eco"
    >("auto");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Load personal prefs from localStorage.
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
            }
        } catch {
            // Ignore parse errors.
        }
        // Load site-level prefs from settings.
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => {
                setAnimationsEnabled(s.animationsEnabled ?? true);
                setPerformanceMode(s.performanceMode ?? "auto");
            })
            .catch(() => setError("Failed to load preferences."))
            .finally(() => setLoading(false));
    }, []);

    const savePersonal = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            setError("Failed to save personal preferences.");
        }
    };

    const handleSiteSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    animationsEnabled,
                    performanceMode,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save preferences.");
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
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";

    return (
        <>
            <AdminPageHeader
                title="Preferences"
                description="Personalize your console experience and site display settings."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Preferences saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* ── Personal preferences ────────────────────────────── */}
                    <div className="admin-glass rounded-xl p-6">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <SlidersHorizontal className="h-4 w-4 text-[var(--accent-solid)]" />
                            Console Preferences
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            Saved to this browser. Each device keeps its own
                            layout.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                                    Density
                                </label>
                                <select
                                    value={prefs.density}
                                    onChange={(e) =>
                                        setPrefs({
                                            ...prefs,
                                            density: e.target.value as
                                                | "comfortable"
                                                | "compact",
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="comfortable">
                                        Comfortable
                                    </option>
                                    <option value="compact">Compact</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                                    Default Landing Page
                                </label>
                                <select
                                    value={prefs.defaultLanding}
                                    onChange={(e) =>
                                        setPrefs({
                                            ...prefs,
                                            defaultLanding: e.target.value as
                                                | "dashboard"
                                                | "projects"
                                                | "blog",
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="dashboard">Dashboard</option>
                                    <option value="projects">Projects</option>
                                    <option value="blog">Blog</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    checked={prefs.confirmDestructive}
                                    onChange={(e) =>
                                        setPrefs({
                                            ...prefs,
                                            confirmDestructive:
                                                e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-[var(--border-default)]"
                                />
                                Confirm before destructive actions
                            </label>
                        </div>
                        <button
                            onClick={savePersonal}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                        >
                            <Save className="h-4 w-4" />
                            Save Console Preferences
                        </button>
                    </div>

                    {/* ── Site-level preferences ─────────────────────────── */}
                    <form
                        onSubmit={handleSiteSubmit}
                        className="admin-glass rounded-xl p-6"
                    >
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Monitor className="h-4 w-4 text-[var(--accent-solid)]" />
                            Site Display
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            These settings affect the public site for all
                            visitors.
                        </p>
                        <div className="space-y-4">
                            <label className="flex items-start gap-3 rounded-lg bg-[var(--canvas-sunken)] p-3">
                                <input
                                    type="checkbox"
                                    checked={animationsEnabled}
                                    onChange={(e) =>
                                        setAnimationsEnabled(e.target.checked)
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-default)]"
                                />
                                <div>
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                                        <Sparkles className="h-3.5 w-3.5 text-[var(--accent-solid)]" />
                                        Enable animations
                                    </span>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        Motion + transitions on the public
                                        site. Disabled for reduced-motion
                                        users regardless.
                                    </p>
                                </div>
                            </label>
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                                    <Gauge className="h-3.5 w-3.5" />
                                    Performance Mode
                                </label>
                                <select
                                    value={performanceMode}
                                    onChange={(e) =>
                                        setPerformanceMode(
                                            e.target.value as
                                            | "auto"
                                            | "high"
                                            | "eco",
                                        )
                                    }
                                    className={inputClass}
                                >
                                    <option value="auto">
                                        Auto — adapt to device
                                    </option>
                                    <option value="high">
                                        High — full fidelity
                                    </option>
                                    <option value="eco">
                                        Eco — reduced effects
                                    </option>
                                </select>
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-quaternary)]">
                                    <Zap className="h-3 w-3" />
                                    Eco mode lowers the 3D tier and disables
                                    heavy post-processing.
                                </p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Site Display
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
