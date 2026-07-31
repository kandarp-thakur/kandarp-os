"use client";

/**
 * Website Builder page — the visual section editor.
 *
 * Lets the user:
 *   • Toggle section visibility (show/hide).
 *   • Reorder sections (move up/down).
 *   • Edit each section's label, layout, background, colors, icon, animation,
 *     content overrides, CTA buttons, and device/auth visibility rules.
 *   • Edit page-level settings (max width, spacing, padding).
 *
 * All changes save via PATCH to /api/admin/site-customization.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    GripVertical,
    Loader2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { SectionConfig, SiteCustomization } from "@backend/schemas/types";

const inputClass =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
const cardClass =
    "rounded-xl border border-[var(--border-default)] bg-[var(--canvas-sunken)]/50 p-4";

export default function WebsiteBuilderPage() {
    const [data, setData] = useState<SiteCustomization | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/site-customization");
            if (!res.ok) throw new Error("Failed to load");
            const sc: SiteCustomization = await res.json();
            setData(sc);
        } catch {
            setError("Failed to load site customization.");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (!data) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/site-customization", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setError(d.error ?? "Failed to save.");
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

    /* ── Section helpers ──────────────────────────────────────────────── */

    const sortedSections = (): SectionConfig[] => {
        if (!data) return [];
        return [...data.sections].sort((a, b) => a.order - b.order);
    };

    const updateSection = (id: string, patch: Partial<SectionConfig>) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                sections: prev.sections.map((s) =>
                    s.id === id ? { ...s, ...patch } : s,
                ),
            };
        });
    };

    const toggleVisible = (id: string) => {
        const sec = data?.sections.find((s) => s.id === id);
        if (sec) updateSection(id, { visible: !sec.visible });
    };

    const moveSection = (id: string, dir: -1 | 1) => {
        if (!data) return;
        const sections = sortedSections();
        const idx = sections.findIndex((s) => s.id === id);
        if (idx < 0) return;
        const target = idx + dir;
        if (target < 0 || target >= sections.length) return;
        const reordered = [...sections];
        const a = reordered[idx];
        const b = reordered[target];
        if (a && b) {
            reordered[idx] = b;
            reordered[target] = a;
        }
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                sections: reordered.map((s, i) => ({ ...s, order: i })),
            };
        });
    };

    const deleteSection = (id: string) => {
        setData((prev) => {
            if (!prev) return prev;
            const filtered = prev.sections.filter((s) => s.id !== id);
            return {
                ...prev,
                sections: filtered.map((s, i) => ({ ...s, order: i })),
            };
        });
    };

    const addSection = () => {
        if (!data) return;
        const newSec: SectionConfig = {
            id: crypto.randomUUID(),
            type: "custom",
            label: "New Section",
            visible: true,
            order: data.sections.length,
            layout: "default",
            background: { type: "none" },
            colors: {},
            icon: undefined,
            animation: {
                enabled: true,
                type: "fade-up",
                duration: 600,
                delay: 0,
            },
            content: {},
            buttons: [],
            visibility: {
                desktop: true,
                tablet: true,
                mobile: true,
                requireAuth: false,
            },
        };
        setData((prev) =>
            prev ? { ...prev, sections: [...prev.sections, newSec] } : prev,
        );
        setExpandedId(newSec.id);
    };

    /* ── Page-level helpers ───────────────────────────────────────────── */

    const updatePage = (patch: Partial<SiteCustomization["page"]>) => {
        setData((prev) =>
            prev ? { ...prev, page: { ...prev.page, ...patch } } : prev,
        );
    };

    /* ── Render ────────────────────────────────────────────────────────── */

    if (!data) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    const sections = sortedSections();

    return (
        <>
            <AdminPageHeader
                title="Website Builder"
                description="Customize sections, layouts, backgrounds, and visibility — no code required."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Saved successfully.
                </div>
            )}

            <form onSubmit={save} className="space-y-6">
                {/* ── Page-level settings ─────────────────────────────────── */}
                <div className={cardClass}>
                    <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Page Layout
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className={labelClass}>Max Width</label>
                            <select
                                value={data.page.maxWidth}
                                onChange={(e) =>
                                    updatePage({ maxWidth: e.target.value })
                                }
                                className={inputClass}
                            >
                                <option value="max-w-3xl">
                                    Narrow (max-w-3xl)
                                </option>
                                <option value="max-w-4xl">
                                    Medium (max-w-4xl)
                                </option>
                                <option value="max-w-5xl">
                                    Wide (max-w-5xl)
                                </option>
                                <option value="max-w-6xl">
                                    Extra Wide (max-w-6xl)
                                </option>
                                <option value="max-w-7xl">
                                    Full (max-w-7xl)
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Section Spacing
                            </label>
                            <select
                                value={data.page.sectionSpacing}
                                onChange={(e) =>
                                    updatePage({
                                        sectionSpacing: e.target.value,
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="py-8">Compact (py-8)</option>
                                <option value="py-12">
                                    Comfortable (py-12)
                                </option>
                                <option value="py-16">Spacious (py-16)</option>
                                <option value="py-20">
                                    Extra Spacious (py-20)
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Container Padding
                            </label>
                            <select
                                value={data.page.containerPadding}
                                onChange={(e) =>
                                    updatePage({
                                        containerPadding: e.target.value,
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="px-4 sm:px-6">Standard</option>
                                <option value="px-6 sm:px-8">Wide</option>
                                <option value="px-4">Narrow</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Sections list ───────────────────────────────────────── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            Sections ({sections.length})
                        </h3>
                        <button
                            type="button"
                            onClick={addSection}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--canvas-elevated)]"
                        >
                            <Plus className="h-4 w-4" />
                            Add Section
                        </button>
                    </div>

                    {sections.map((section, idx) => {
                        const isExpanded = expandedId === section.id;
                        return (
                            <div
                                key={section.id}
                                className={`rounded-xl border bg-[var(--canvas-sunken)]/50 transition-colors ${
                                    isExpanded
                                        ? "border-[var(--border-focus)]"
                                        : "border-[var(--border-default)]"
                                }`}
                            >
                                {/* Section header row */}
                                <div className="flex items-center gap-3 p-3">
                                    <GripVertical className="h-5 w-5 shrink-0 text-[var(--text-quaternary)]" />

                                    {/* Move up/down */}
                                    <div className="flex flex-col">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                moveSection(section.id, -1)
                                            }
                                            disabled={idx === 0}
                                            className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                moveSection(section.id, 1)
                                            }
                                            disabled={
                                                idx === sections.length - 1
                                            }
                                            className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Toggle visibility */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleVisible(section.id)
                                        }
                                        className={`shrink-0 transition-colors ${
                                            section.visible
                                                ? "text-[var(--success)]"
                                                : "text-[var(--text-quaternary)]"
                                        }`}
                                        title={
                                            section.visible
                                                ? "Visible"
                                                : "Hidden"
                                        }
                                    >
                                        {section.visible ? (
                                            <Eye className="h-5 w-5" />
                                        ) : (
                                            <EyeOff className="h-5 w-5" />
                                        )}
                                    </button>

                                    {/* Label + type */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedId(
                                                isExpanded ? null : section.id,
                                            )
                                        }
                                        className="flex flex-1 items-center gap-2 text-left"
                                    >
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            {section.label}
                                        </span>
                                        <span className="rounded bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-tertiary)]">
                                            {section.type}
                                        </span>
                                        {!section.visible && (
                                            <span className="text-xs text-[var(--text-quaternary)]">
                                                (hidden)
                                            </span>
                                        )}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteSection(section.id)
                                        }
                                        className="shrink-0 text-[var(--text-tertiary)] transition-colors hover:text-[var(--error)]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Expanded section editor */}
                                {isExpanded && (
                                    <div className="border-t border-[var(--border-default)] p-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {/* Label */}
                                            <div>
                                                <label className={labelClass}>
                                                    Label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={section.label}
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                label: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Type */}
                                            <div>
                                                <label className={labelClass}>
                                                    Section Type
                                                </label>
                                                <input
                                                    type="text"
                                                    value={section.type}
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                type: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Layout */}
                                            <div>
                                                <label className={labelClass}>
                                                    Layout
                                                </label>
                                                <select
                                                    value={section.layout}
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                layout: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value="default">
                                                        Default
                                                    </option>
                                                    <option value="grid">
                                                        Grid
                                                    </option>
                                                    <option value="list">
                                                        List
                                                    </option>
                                                    <option value="terminal">
                                                        Terminal
                                                    </option>
                                                    <option value="cards">
                                                        Cards
                                                    </option>
                                                    <option value="minimal">
                                                        Minimal
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Icon */}
                                            <div>
                                                <label className={labelClass}>
                                                    Icon (lucide name)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={section.icon ?? ""}
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                icon:
                                                                    e.target
                                                                        .value ||
                                                                    undefined,
                                                            },
                                                        )
                                                    }
                                                    placeholder="e.g. FolderKanban"
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Background type */}
                                            <div>
                                                <label className={labelClass}>
                                                    Background
                                                </label>
                                                <select
                                                    value={
                                                        section.background.type
                                                    }
                                                    onChange={(e) => {
                                                        const type = e.target
                                                            .value as SectionConfig["background"]["type"];
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                background: {
                                                                    ...section.background,
                                                                    type,
                                                                },
                                                            },
                                                        );
                                                    }}
                                                    className={inputClass}
                                                >
                                                    <option value="none">
                                                        None
                                                    </option>
                                                    <option value="color">
                                                        Solid Color
                                                    </option>
                                                    <option value="gradient">
                                                        Gradient
                                                    </option>
                                                    <option value="image">
                                                        Image
                                                    </option>
                                                    <option value="video">
                                                        Video
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Background value (conditional) */}
                                            {section.background.type ===
                                                "color" && (
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Background Color
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            section.background
                                                                .color ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    background:
                                                                        {
                                                                            ...section.background,
                                                                            color: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="#0a0a0f"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            )}
                                            {section.background.type ===
                                                "gradient" && (
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Gradient CSS
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            section.background
                                                                .gradient ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    background:
                                                                        {
                                                                            ...section.background,
                                                                            gradient:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="linear-gradient(135deg, #FF9900, #2496ED)"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            )}
                                            {section.background.type ===
                                                "image" && (
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Image URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            section.background
                                                                .image ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    background:
                                                                        {
                                                                            ...section.background,
                                                                            image: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="/images/bg.jpg"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            )}
                                            {section.background.type ===
                                                "video" && (
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Video URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            section.background
                                                                .video ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    background:
                                                                        {
                                                                            ...section.background,
                                                                            video: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="/videos/bg.mp4"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            )}

                                            {/* Section colors */}
                                            <div>
                                                <label className={labelClass}>
                                                    Heading Color
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        section.colors
                                                            .heading ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                colors: {
                                                                    ...section.colors,
                                                                    heading:
                                                                        e.target
                                                                            .value ||
                                                                        undefined,
                                                                },
                                                            },
                                                        )
                                                    }
                                                    placeholder="inherit"
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    Text Color
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        section.colors.text ??
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                colors: {
                                                                    ...section.colors,
                                                                    text:
                                                                        e.target
                                                                            .value ||
                                                                        undefined,
                                                                },
                                                            },
                                                        )
                                                    }
                                                    placeholder="inherit"
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    Accent Color
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        section.colors.accent ??
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                colors: {
                                                                    ...section.colors,
                                                                    accent:
                                                                        e.target
                                                                            .value ||
                                                                        undefined,
                                                                },
                                                            },
                                                        )
                                                    }
                                                    placeholder="inherit"
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Animation */}
                                            <div>
                                                <label className={labelClass}>
                                                    Animation
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            section.animation
                                                                .enabled
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    animation: {
                                                                        ...section.animation,
                                                                        enabled:
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                    },
                                                                },
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                                    />
                                                    <select
                                                        value={
                                                            section.animation
                                                                .type
                                                        }
                                                        onChange={(e) =>
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    animation: {
                                                                        ...section.animation,
                                                                        type: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                },
                                                            )
                                                        }
                                                        className={inputClass}
                                                        disabled={
                                                            !section.animation
                                                                .enabled
                                                        }
                                                    >
                                                        <option value="fade-up">
                                                            Fade Up
                                                        </option>
                                                        <option value="fade">
                                                            Fade
                                                        </option>
                                                        <option value="slide">
                                                            Slide
                                                        </option>
                                                        <option value="scale">
                                                            Scale
                                                        </option>
                                                        <option value="none">
                                                            None
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    Animation Duration (ms)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        section.animation
                                                            .duration
                                                    }
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                animation: {
                                                                    ...section.animation,
                                                                    duration:
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                },
                                                            },
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    Animation Delay (ms)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        section.animation.delay
                                                    }
                                                    onChange={(e) =>
                                                        updateSection(
                                                            section.id,
                                                            {
                                                                animation: {
                                                                    ...section.animation,
                                                                    delay: Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                },
                                                            },
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Visibility rules */}
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>
                                                    Visibility Rules
                                                </label>
                                                <div className="flex flex-wrap gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                section
                                                                    .visibility
                                                                    .desktop
                                                            }
                                                            onChange={(e) =>
                                                                updateSection(
                                                                    section.id,
                                                                    {
                                                                        visibility:
                                                                            {
                                                                                ...section.visibility,
                                                                                desktop:
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-[var(--border-default)]"
                                                        />
                                                        Desktop
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                section
                                                                    .visibility
                                                                    .tablet
                                                            }
                                                            onChange={(e) =>
                                                                updateSection(
                                                                    section.id,
                                                                    {
                                                                        visibility:
                                                                            {
                                                                                ...section.visibility,
                                                                                tablet: e
                                                                                    .target
                                                                                    .checked,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-[var(--border-default)]"
                                                        />
                                                        Tablet
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                section
                                                                    .visibility
                                                                    .mobile
                                                            }
                                                            onChange={(e) =>
                                                                updateSection(
                                                                    section.id,
                                                                    {
                                                                        visibility:
                                                                            {
                                                                                ...section.visibility,
                                                                                mobile: e
                                                                                    .target
                                                                                    .checked,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-[var(--border-default)]"
                                                        />
                                                        Mobile
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                section
                                                                    .visibility
                                                                    .requireAuth
                                                            }
                                                            onChange={(e) =>
                                                                updateSection(
                                                                    section.id,
                                                                    {
                                                                        visibility:
                                                                            {
                                                                                ...section.visibility,
                                                                                requireAuth:
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-[var(--border-default)]"
                                                        />
                                                        Require Auth
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Content overrides (JSON) */}
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>
                                                    Content Overrides (JSON —
                                                    eyebrow, title, subtitle,
                                                    etc.)
                                                </label>
                                                <textarea
                                                    value={JSON.stringify(
                                                        section.content,
                                                        null,
                                                        2,
                                                    )}
                                                    onChange={(e) => {
                                                        try {
                                                            const parsed =
                                                                JSON.parse(
                                                                    e.target
                                                                        .value,
                                                                );
                                                            updateSection(
                                                                section.id,
                                                                {
                                                                    content:
                                                                        parsed,
                                                                },
                                                            );
                                                        } catch {
                                                            // ignore invalid JSON while typing
                                                        }
                                                    }}
                                                    rows={4}
                                                    className={`${inputClass} font-mono`}
                                                    placeholder='{"eyebrow": "// PROJECTS", "title": "My Projects"}'
                                                />
                                            </div>

                                            {/* CTA Buttons */}
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>
                                                    CTA Buttons
                                                </label>
                                                <div className="space-y-2">
                                                    {section.buttons.map(
                                                        (btn, bIdx) => (
                                                            <div
                                                                key={btn.id}
                                                                className="flex gap-2"
                                                            >
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        btn.label
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const buttons =
                                                                            [
                                                                                ...section.buttons,
                                                                            ];
                                                                        buttons[
                                                                            bIdx
                                                                        ] = {
                                                                            ...btn,
                                                                            label: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                        updateSection(
                                                                            section.id,
                                                                            {
                                                                                buttons,
                                                                            },
                                                                        );
                                                                    }}
                                                                    placeholder="Label"
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        btn.href
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const buttons =
                                                                            [
                                                                                ...section.buttons,
                                                                            ];
                                                                        buttons[
                                                                            bIdx
                                                                        ] = {
                                                                            ...btn,
                                                                            href: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                        updateSection(
                                                                            section.id,
                                                                            {
                                                                                buttons,
                                                                            },
                                                                        );
                                                                    }}
                                                                    placeholder="/link"
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                />
                                                                <select
                                                                    value={
                                                                        btn.variant
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const buttons =
                                                                            [
                                                                                ...section.buttons,
                                                                            ];
                                                                        buttons[
                                                                            bIdx
                                                                        ] = {
                                                                            ...btn,
                                                                            variant:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        };
                                                                        updateSection(
                                                                            section.id,
                                                                            {
                                                                                buttons,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                >
                                                                    <option value="primary">
                                                                        Primary
                                                                    </option>
                                                                    <option value="secondary">
                                                                        Secondary
                                                                    </option>
                                                                </select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const buttons =
                                                                            section.buttons.filter(
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    i !==
                                                                                    bIdx,
                                                                            );
                                                                        updateSection(
                                                                            section.id,
                                                                            {
                                                                                buttons,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--error)]"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ),
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const buttons = [
                                                                ...section.buttons,
                                                                {
                                                                    id: crypto.randomUUID(),
                                                                    label: "Button",
                                                                    href: "#",
                                                                    variant:
                                                                        "primary",
                                                                },
                                                            ];
                                                            updateSection(
                                                                section.id,
                                                                { buttons },
                                                            );
                                                        }}
                                                        className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Add Button
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-solid)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
