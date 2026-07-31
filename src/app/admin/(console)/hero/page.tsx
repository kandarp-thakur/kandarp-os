"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { HeroConfig, SafeSettings } from "@backend/schemas/types";

const inputClass =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
const cardClass =
    "rounded-xl border border-[var(--border-default)] bg-[var(--canvas-sunken)]/50 p-5";

export default function AdminHeroPage() {
    const [settings, setSettings] = useState<SafeSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/settings");
            if (!response.ok) throw new Error("Failed to load Hero settings.");
            setSettings((await response.json()) as SafeSettings);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to load Hero settings.",
            );
        }
    }, []);

    useEffect(() => void load(), [load]);

    const patchHero = (patch: Partial<HeroConfig>) =>
        setSettings((current) =>
            current
                ? { ...current, hero: { ...current.hero, ...patch } }
                : current,
        );

    async function save(event: FormEvent) {
        event.preventDefault();
        if (!settings) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ hero: settings.hero }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(
                    payload.error ?? "Failed to save Hero settings.",
                );
            setSettings(payload as SafeSettings);
            setSuccess(true);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to save Hero settings.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (!settings) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    const hero = settings.hero;
    return (
        <>
            <AdminPageHeader
                title="Hero"
                description="Manage all public Hero copy, cards, links, terminal commands, and visual effects."
            />
            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Hero saved and public caches invalidated.
                </div>
            )}

            <form onSubmit={save} className="space-y-6">
                <section className={cardClass}>
                    <h2 className="mb-4 font-semibold text-[var(--text-primary)]">
                        Content
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {(
                            [
                                "eyebrow",
                                "bootBanner",
                                "bootStatus",
                                "title",
                                "subtitle",
                            ] as const
                        ).map((key) => (
                            <label key={key}>
                                <span className={labelClass}>
                                    {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <input
                                    className={inputClass}
                                    value={hero[key]}
                                    onChange={(event) =>
                                        patchHero({ [key]: event.target.value })
                                    }
                                    required
                                />
                            </label>
                        ))}
                        <label className="sm:col-span-2">
                            <span className={labelClass}>Description</span>
                            <textarea
                                className={inputClass}
                                rows={4}
                                value={hero.description}
                                onChange={(event) =>
                                    patchHero({
                                        description: event.target.value,
                                    })
                                }
                                required
                            />
                        </label>
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-[var(--text-primary)]">
                            Skill cards
                        </h2>
                        <button
                            type="button"
                            className="flex items-center gap-1 text-sm"
                            onClick={() =>
                                patchHero({
                                    stats: [
                                        ...hero.stats,
                                        { label: "", value: "" },
                                    ],
                                })
                            }
                        >
                            <Plus className="h-4 w-4" /> Add
                        </button>
                    </div>
                    <div className="space-y-3">
                        {hero.stats.map((stat, index) => (
                            <div
                                // Draft rows can be identical; their position is their editor identity.
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                className="grid grid-cols-[1fr_1fr_auto] gap-2"
                            >
                                <input
                                    className={inputClass}
                                    placeholder="Label"
                                    value={stat.label}
                                    onChange={(event) =>
                                        patchHero({
                                            stats: hero.stats.map((item, i) =>
                                                i === index
                                                    ? {
                                                          ...item,
                                                          label: event.target
                                                              .value,
                                                      }
                                                    : item,
                                            ),
                                        })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="Value"
                                    value={stat.value}
                                    onChange={(event) =>
                                        patchHero({
                                            stats: hero.stats.map((item, i) =>
                                                i === index
                                                    ? {
                                                          ...item,
                                                          value: event.target
                                                              .value,
                                                      }
                                                    : item,
                                            ),
                                        })
                                    }
                                />
                                <button
                                    type="button"
                                    aria-label="Remove card"
                                    onClick={() =>
                                        patchHero({
                                            stats: hero.stats.filter(
                                                (_, i) => i !== index,
                                            ),
                                        })
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-[var(--text-primary)]">
                            CTA buttons
                        </h2>
                        <button
                            type="button"
                            className="flex items-center gap-1 text-sm"
                            onClick={() =>
                                patchHero({
                                    ctas: [
                                        ...hero.ctas,
                                        {
                                            id: crypto.randomUUID(),
                                            label: "",
                                            href: "#",
                                            variant: "primary",
                                            external: false,
                                        },
                                    ],
                                })
                            }
                        >
                            <Plus className="h-4 w-4" /> Add
                        </button>
                    </div>
                    <div className="space-y-3">
                        {hero.ctas.map((cta, index) => (
                            <div
                                key={cta.id}
                                className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]"
                            >
                                <input
                                    className={inputClass}
                                    placeholder="Label"
                                    value={cta.label}
                                    onChange={(event) =>
                                        patchHero({
                                            ctas: hero.ctas.map((item, i) =>
                                                i === index
                                                    ? {
                                                          ...item,
                                                          label: event.target
                                                              .value,
                                                      }
                                                    : item,
                                            ),
                                        })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="#section or URL"
                                    value={cta.href}
                                    onChange={(event) =>
                                        patchHero({
                                            ctas: hero.ctas.map((item, i) =>
                                                i === index
                                                    ? {
                                                          ...item,
                                                          href: event.target
                                                              .value,
                                                      }
                                                    : item,
                                            ),
                                        })
                                    }
                                />
                                <select
                                    className={inputClass}
                                    value={cta.variant}
                                    onChange={(event) =>
                                        patchHero({
                                            ctas: hero.ctas.map((item, i) =>
                                                i === index
                                                    ? {
                                                          ...item,
                                                          variant: event.target
                                                              .value as HeroConfig["ctas"][number]["variant"],
                                                      }
                                                    : item,
                                            ),
                                        })
                                    }
                                >
                                    <option value="primary">Primary</option>
                                    <option value="glass">Glass</option>
                                    <option value="ghost">Ghost</option>
                                </select>
                                <button
                                    type="button"
                                    aria-label="Remove CTA"
                                    onClick={() =>
                                        patchHero({
                                            ctas: hero.ctas.filter(
                                                (_, i) => i !== index,
                                            ),
                                        })
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={cardClass}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-[var(--text-primary)]">
                            Social links
                        </h2>
                        <button
                            type="button"
                            className="flex items-center gap-1 text-sm"
                            onClick={() =>
                                patchHero({
                                    socials: [
                                        ...hero.socials,
                                        {
                                            id: crypto.randomUUID(),
                                            label: "",
                                            href: "",
                                            platform: "github",
                                            external: true,
                                        },
                                    ],
                                })
                            }
                        >
                            <Plus className="h-4 w-4" /> Add
                        </button>
                    </div>
                    <div className="space-y-3">
                        {hero.socials.map((social, index) => (
                            <div
                                key={social.id}
                                className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]"
                            >
                                <input
                                    className={inputClass}
                                    placeholder="Accessible label"
                                    value={social.label}
                                    onChange={(event) =>
                                        patchHero({
                                            socials: hero.socials.map(
                                                (item, i) =>
                                                    i === index
                                                        ? {
                                                              ...item,
                                                              label: event
                                                                  .target.value,
                                                          }
                                                        : item,
                                            ),
                                        })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="URL"
                                    value={social.href}
                                    onChange={(event) =>
                                        patchHero({
                                            socials: hero.socials.map(
                                                (item, i) =>
                                                    i === index
                                                        ? {
                                                              ...item,
                                                              href: event.target
                                                                  .value,
                                                          }
                                                        : item,
                                            ),
                                        })
                                    }
                                />
                                <select
                                    className={inputClass}
                                    value={social.platform}
                                    onChange={(event) =>
                                        patchHero({
                                            socials: hero.socials.map(
                                                (item, i) =>
                                                    i === index
                                                        ? {
                                                              ...item,
                                                              platform:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : item,
                                            ),
                                        })
                                    }
                                >
                                    <option value="github">GitHub</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="email">Email</option>
                                </select>
                                <button
                                    type="button"
                                    aria-label="Remove social"
                                    onClick={() =>
                                        patchHero({
                                            socials: hero.socials.filter(
                                                (_, i) => i !== index,
                                            ),
                                        })
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={cardClass}>
                    <h2 className="mb-4 font-semibold text-[var(--text-primary)]">
                        Terminal
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className={labelClass}>
                                Roles (one per line)
                            </span>
                            <textarea
                                className={inputClass}
                                rows={6}
                                value={hero.terminal.roles.join("\n")}
                                onChange={(event) =>
                                    patchHero({
                                        terminal: {
                                            ...hero.terminal,
                                            roles: event.target.value
                                                .split("\n")
                                                .filter(Boolean),
                                        },
                                    })
                                }
                            />
                        </label>
                        <label>
                            <span className={labelClass}>Script JSON</span>
                            <textarea
                                className={`${inputClass} font-mono`}
                                rows={6}
                                value={JSON.stringify(
                                    hero.terminal.script,
                                    null,
                                    2,
                                )}
                                onChange={(event) => {
                                    try {
                                        patchHero({
                                            terminal: {
                                                ...hero.terminal,
                                                script: JSON.parse(
                                                    event.target.value,
                                                ) as HeroConfig["terminal"]["script"],
                                            },
                                        });
                                    } catch {
                                        /* preserve last valid script while editing */
                                    }
                                }}
                            />
                        </label>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        {(
                            [
                                "char",
                                "pause",
                                "read",
                                "roleDwell",
                                "roleCycles",
                                "loop",
                                "startDelay",
                            ] as const
                        ).map((key) => (
                            <label key={key}>
                                <span className={labelClass}>{key}</span>
                                <input
                                    type="number"
                                    min={0}
                                    className={inputClass}
                                    value={hero.terminal[key]}
                                    onChange={(event) =>
                                        patchHero({
                                            terminal: {
                                                ...hero.terminal,
                                                [key]: Number(
                                                    event.target.value,
                                                ),
                                            },
                                        })
                                    }
                                />
                            </label>
                        ))}
                    </div>
                </section>

                <section className={cardClass}>
                    <h2 className="mb-4 font-semibold text-[var(--text-primary)]">
                        Visual effects
                    </h2>
                    <div className="flex flex-wrap gap-6">
                        {(
                            [
                                "backgroundEnabled",
                                "particlesEnabled",
                                "infinityLoopEnabled",
                                "threeEnabled",
                            ] as const
                        ).map((key) => (
                            <label
                                key={key}
                                className="flex items-center gap-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={hero.visual[key]}
                                    onChange={(event) =>
                                        patchHero({
                                            visual: {
                                                ...hero.visual,
                                                [key]: event.target.checked,
                                            },
                                        })
                                    }
                                />
                                {key.replace(/([A-Z])/g, " $1")}
                            </label>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-solid)] px-5 py-2.5 font-medium text-white disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving…" : "Save Hero"}
                </button>
            </form>
        </>
    );
}
