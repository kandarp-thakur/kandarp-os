"use client";

/**
 * Settings page — edit the singleton settings object.
 *
 * Full CMS settings: site info, contact, brand, theme, typography, color
 * palette, navigation, footer, maintenance, SEO, custom CSS/JS, integrations,
 * cache, and notification emails. Saves via PATCH.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Settings } from "@/lib/admin/types";

export default function AdminSettingsPage() {
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

    /* ── Patch helpers ─────────────────────────────────────────────────── */
    const patch = (p: Partial<Settings>) =>
        setForm((prev) => (prev ? { ...prev, ...p } : prev));

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
                title="Settings"
                description="Manage your site configuration, branding, and integrations."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Settings saved successfully.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Hero Avatar ─────────────────────────────────────────── */}
                <div className={cardClass}>
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Hero Avatar
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                            Ready Player Me GLB/VRM model controls for the hero
                            mascot.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Avatar URL</label>
                            <input
                                value={form.heroAvatar?.avatarUrl ?? ""}
                                onChange={(e) =>
                                    patch({
                                        heroAvatar: {
                                            ...form.heroAvatar,
                                            avatarUrl: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                                placeholder="/models/kandarp-ready-player-me.glb"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Avatar Scale</label>
                            <input
                                type="number"
                                step="0.05"
                                value={form.heroAvatar?.avatarScale ?? 1}
                                onChange={(e) =>
                                    patch({
                                        heroAvatar: {
                                            ...form.heroAvatar,
                                            avatarScale: Number(e.target.value),
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Animation Speed
                            </label>
                            <input
                                type="number"
                                step="0.05"
                                value={form.heroAvatar?.animationSpeed ?? 1}
                                onChange={(e) =>
                                    patch({
                                        heroAvatar: {
                                            ...form.heroAvatar,
                                            animationSpeed: Number(
                                                e.target.value,
                                            ),
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <VectorField
                            label="Avatar Position"
                            value={
                                form.heroAvatar?.avatarPosition ?? [0, -1.35, 0]
                            }
                            onChange={(avatarPosition) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        avatarPosition,
                                    },
                                })
                            }
                            inputClass={inputClass}
                            labelClass={labelClass}
                        />
                        <VectorField
                            label="Avatar Rotation"
                            value={form.heroAvatar?.avatarRotation ?? [0, 0, 0]}
                            onChange={(avatarRotation) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        avatarRotation,
                                    },
                                })
                            }
                            inputClass={inputClass}
                            labelClass={labelClass}
                        />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <ToggleField
                            label="Idle Animation"
                            checked={form.heroAvatar?.idleAnimation ?? true}
                            onChange={(idleAnimation) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        idleAnimation,
                                    },
                                })
                            }
                        />
                        <ToggleField
                            label="Mouse Follow"
                            checked={form.heroAvatar?.mouseFollow ?? true}
                            onChange={(mouseFollow) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        mouseFollow,
                                    },
                                })
                            }
                        />
                        <ToggleField
                            label="Enable Shadows"
                            checked={form.heroAvatar?.enableShadows ?? true}
                            onChange={(enableShadows) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        enableShadows,
                                    },
                                })
                            }
                        />
                        <ToggleField
                            label="Enable Bloom"
                            checked={form.heroAvatar?.enableBloom ?? true}
                            onChange={(enableBloom) =>
                                patch({
                                    heroAvatar: {
                                        ...form.heroAvatar,
                                        enableBloom,
                                    },
                                })
                            }
                        />
                    </div>
                </div>

                {/* ── Site Info ───────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Site Info
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Site Name</label>
                            <input
                                value={form.siteName}
                                onChange={(e) =>
                                    patch({ siteName: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Owner Name</label>
                            <input
                                value={form.ownerName}
                                onChange={(e) =>
                                    patch({ ownerName: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                value={form.email}
                                onChange={(e) =>
                                    patch({ email: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Phone</label>
                            <input
                                value={form.phone}
                                onChange={(e) =>
                                    patch({ phone: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Logo URL</label>
                            <input
                                value={form.logo ?? ""}
                                onChange={(e) =>
                                    patch({ logo: e.target.value || undefined })
                                }
                                className={inputClass}
                                placeholder="/logo.svg"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Favicon URL</label>
                            <input
                                value={form.favicon ?? ""}
                                onChange={(e) =>
                                    patch({
                                        favicon: e.target.value || undefined,
                                    })
                                }
                                className={inputClass}
                                placeholder="/icon.svg"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Contact ─────────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Contact
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Contact Email</label>
                            <input
                                value={form.contact.email}
                                onChange={(e) =>
                                    patch({
                                        contact: {
                                            ...form.contact,
                                            email: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Contact Phone</label>
                            <input
                                value={form.contact.phone}
                                onChange={(e) =>
                                    patch({
                                        contact: {
                                            ...form.contact,
                                            phone: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Address</label>
                            <input
                                value={form.contact.address}
                                onChange={(e) =>
                                    patch({
                                        contact: {
                                            ...form.contact,
                                            address: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Location</label>
                            <input
                                value={form.contact.location}
                                onChange={(e) =>
                                    patch({
                                        contact: {
                                            ...form.contact,
                                            location: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Brand ───────────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Brand
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Primary Color</label>
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
                                placeholder="#2496ED"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Accent Color</label>
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
                                placeholder="#38BDF8"
                            />
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
                                rows={2}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Theme & Typography ──────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Theme & Typography
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Theme</label>
                            <select
                                value={form.theme}
                                onChange={(e) =>
                                    patch({
                                        theme: e.target.value as
                                            "dark" | "light",
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
                                            "auto" | "high" | "eco",
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
                        <div>
                            <label className={labelClass}>Heading Font</label>
                            <input
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
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Body Font</label>
                            <input
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
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Mono Font</label>
                            <input
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
                            />
                        </div>
                    </div>
                </div>

                {/* ── Color Palette ───────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Color Palette
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {(
                            [
                                ["background", "Background"],
                                ["surface", "Surface"],
                                ["text", "Text"],
                                ["textMuted", "Text Muted"],
                                ["border", "Border"],
                                ["success", "Success"],
                                ["warning", "Warning"],
                                ["error", "Error"],
                            ] as const
                        ).map(([key, label]) => (
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

                {/* ── Navigation ──────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Navigation
                    </h2>
                    <div className="space-y-2">
                        {form.navigation.map((nav, idx) => (
                            <div key={nav.id} className="flex gap-2">
                                <input
                                    value={nav.label}
                                    onChange={(e) => {
                                        const navigation = [...form.navigation];
                                        navigation[idx] = {
                                            ...nav,
                                            label: e.target.value,
                                        };
                                        patch({ navigation });
                                    }}
                                    placeholder="Label"
                                    className={inputClass}
                                />
                                <input
                                    value={nav.href}
                                    onChange={(e) => {
                                        const navigation = [...form.navigation];
                                        navigation[idx] = {
                                            ...nav,
                                            href: e.target.value,
                                        };
                                        patch({ navigation });
                                    }}
                                    placeholder="/path"
                                    className={inputClass}
                                />
                                <label className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                    <input
                                        type="checkbox"
                                        checked={nav.visible}
                                        onChange={(e) => {
                                            const navigation = [
                                                ...form.navigation,
                                            ];
                                            navigation[idx] = {
                                                ...nav,
                                                visible: e.target.checked,
                                            };
                                            patch({ navigation });
                                        }}
                                        className="h-4 w-4"
                                    />
                                    Vis
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        patch({
                                            navigation: form.navigation.filter(
                                                (_, i) => i !== idx,
                                            ),
                                        })
                                    }
                                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                patch({
                                    navigation: [
                                        ...form.navigation,
                                        {
                                            id: crypto.randomUUID(),
                                            label: "New Link",
                                            href: "/",
                                            visible: true,
                                            external: false,
                                            children: [],
                                        },
                                    ],
                                })
                            }
                            className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            <Plus className="h-4 w-4" />
                            Add Nav Link
                        </button>
                    </div>
                </div>

                {/* ── Footer ──────────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Footer
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Copyright Text</label>
                            <input
                                value={form.footer.copyright}
                                onChange={(e) =>
                                    patch({
                                        footer: {
                                            ...form.footer,
                                            copyright: e.target.value,
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={form.footer.showSocials}
                                onChange={(e) =>
                                    patch({
                                        footer: {
                                            ...form.footer,
                                            showSocials: e.target.checked,
                                        },
                                    })
                                }
                                className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                            />
                            Show social links in footer
                        </label>
                        <div>
                            <label className={labelClass}>Footer Columns</label>
                            <div className="space-y-2">
                                {form.footer.columns.map((col, cIdx) => (
                                    <div key={col.id} className="flex gap-2">
                                        <input
                                            value={col.title}
                                            onChange={(e) => {
                                                const columns = [
                                                    ...form.footer.columns,
                                                ];
                                                columns[cIdx] = {
                                                    ...col,
                                                    title: e.target.value,
                                                };
                                                patch({
                                                    footer: {
                                                        ...form.footer,
                                                        columns,
                                                    },
                                                });
                                            }}
                                            placeholder="Column title"
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                patch({
                                                    footer: {
                                                        ...form.footer,
                                                        columns:
                                                            form.footer.columns.filter(
                                                                (_, i) =>
                                                                    i !== cIdx,
                                                            ),
                                                    },
                                                })
                                            }
                                            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--error)]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() =>
                                        patch({
                                            footer: {
                                                ...form.footer,
                                                columns: [
                                                    ...form.footer.columns,
                                                    {
                                                        id: crypto.randomUUID(),
                                                        title: "New Column",
                                                        links: [],
                                                    },
                                                ],
                                            },
                                        })
                                    }
                                    className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Column
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Maintenance ─────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Maintenance Mode
                    </h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={form.maintenanceMode}
                                onChange={(e) =>
                                    patch({ maintenanceMode: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                            />
                            Enable maintenance mode
                        </label>
                        <div>
                            <label className={labelClass}>
                                Maintenance Message
                            </label>
                            <textarea
                                value={form.maintenanceMessage}
                                onChange={(e) =>
                                    patch({
                                        maintenanceMessage: e.target.value,
                                    })
                                }
                                rows={2}
                                className={inputClass}
                                placeholder="We'll be right back…"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Custom Code ─────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Custom Code
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label
                                className={labelClass}
                            >{`Custom CSS (injected into <head>)`}</label>
                            <textarea
                                value={form.customCss}
                                onChange={(e) =>
                                    patch({ customCss: e.target.value })
                                }
                                rows={5}
                                className={`${inputClass} font-mono`}
                                placeholder=":root { --accent: #2496ED; }"
                            />
                        </div>
                        <div>
                            <label
                                className={labelClass}
                            >{`Custom JavaScript (injected before </body>)`}</label>
                            <textarea
                                value={form.customJavaScript}
                                onChange={(e) =>
                                    patch({ customJavaScript: e.target.value })
                                }
                                rows={5}
                                className={`${inputClass} font-mono`}
                                placeholder="console.log('Hello from CMS');"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Custom Scripts (head tags, analytics, etc.)
                            </label>
                            <textarea
                                value={form.customScripts}
                                onChange={(e) =>
                                    patch({ customScripts: e.target.value })
                                }
                                rows={3}
                                className={`${inputClass} font-mono`}
                                placeholder="<script>...</script>"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Cache ───────────────────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Cache & Performance
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={form.cache.enabled}
                                onChange={(e) =>
                                    patch({
                                        cache: {
                                            ...form.cache,
                                            enabled: e.target.checked,
                                        },
                                    })
                                }
                                className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                            />
                            Enable cache
                        </label>
                        <div>
                            <label className={labelClass}>TTL (seconds)</label>
                            <input
                                type="number"
                                value={form.cache.ttlSeconds}
                                onChange={(e) =>
                                    patch({
                                        cache: {
                                            ...form.cache,
                                            ttlSeconds: Number(e.target.value),
                                        },
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Strategy</label>
                            <select
                                value={form.cache.strategy}
                                onChange={(e) =>
                                    patch({
                                        cache: {
                                            ...form.cache,
                                            strategy: e.target.value as
                                                | "memory"
                                                | "filesystem"
                                                | "none",
                                        },
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="memory">Memory</option>
                                <option value="filesystem">Filesystem</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Notification Emails ─────────────────────────────────── */}
                <div className={cardClass}>
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Notification Emails
                    </h2>
                    <div className="space-y-2">
                        {form.notificationEmails.map((email, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    value={email}
                                    onChange={(e) => {
                                        const notificationEmails = [
                                            ...form.notificationEmails,
                                        ];
                                        notificationEmails[idx] =
                                            e.target.value;
                                        patch({ notificationEmails });
                                    }}
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        patch({
                                            notificationEmails:
                                                form.notificationEmails.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                        })
                                    }
                                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                patch({
                                    notificationEmails: [
                                        ...form.notificationEmails,
                                        "",
                                    ],
                                })
                            }
                            className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            <Plus className="h-4 w-4" />
                            Add Email
                        </button>
                    </div>
                </div>

                {/* ── Save ────────────────────────────────────────────────── */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving…" : "Save Settings"}
                    </button>
                </div>
            </form>
        </>
    );
}

function VectorField({
    label,
    value,
    onChange,
    inputClass,
    labelClass,
}: {
    label: string;
    value: [number, number, number];
    onChange: (value: [number, number, number]) => void;
    inputClass: string;
    labelClass: string;
}) {
    const update = (index: 0 | 1 | 2, next: number) => {
        const vector: [number, number, number] = [...value];
        vector[index] = next;
        onChange(vector);
    };

    return (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                    <input
                        key={axis}
                        type="number"
                        step="0.05"
                        value={value[index]}
                        onChange={(e) =>
                            update(index as 0 | 1 | 2, Number(e.target.value))
                        }
                        className={inputClass}
                        aria-label={`${label} ${axis}`}
                    />
                ))}
            </div>
        </div>
    );
}

function ToggleField({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-secondary)]">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
            />
            {label}
        </label>
    );
}
