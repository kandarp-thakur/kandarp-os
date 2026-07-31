"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, Inbox, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { Profile, ProfileSocialLink } from "@backend/schemas/types";

const inputClass =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

export default function AdminContactPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/profile");
            if (!response.ok)
                throw new Error("Failed to load Contact content.");
            setProfile(await response.json());
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to load Contact content.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function save(event: FormEvent) {
        event.preventDefault();
        if (!profile) return;

        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    email: profile.email,
                    phone: profile.phone,
                    github: profile.github || undefined,
                    linkedin: profile.linkedin || undefined,
                    resume: profile.resume,
                    socialLinks: profile.socialLinks,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    payload.error || "Failed to save Contact content.",
                );
            }
            setProfile(payload as Profile);
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 3000);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to save Contact content.",
            );
        } finally {
            setSaving(false);
        }
    }

    function addSocialLink() {
        if (!profile) return;
        const link: ProfileSocialLink = {
            id: crypto.randomUUID(),
            platform: "Website",
            label: "Website",
            url: "https://",
        };
        setProfile({
            ...profile,
            socialLinks: [...profile.socialLinks, link],
        });
    }

    function updateSocialLink(id: string, patch: Partial<ProfileSocialLink>) {
        if (!profile) return;
        setProfile({
            ...profile,
            socialLinks: profile.socialLinks.map((link) =>
                link.id === id ? { ...link, ...patch } : link,
            ),
        });
    }

    function removeSocialLink(id: string) {
        if (!profile) return;
        setProfile({
            ...profile,
            socialLinks: profile.socialLinks.filter((link) => link.id !== id),
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="Contact"
                description="Manage public contact channels and messages from the contact form."
                actions={
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/forms"
                            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                        >
                            <Inbox className="h-4 w-4" />
                            Message inbox
                        </Link>
                        <Link
                            href="/contact"
                            target="_blank"
                            title="View public contact page"
                            aria-label="View public contact page"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </div>
                }
            />

            {error ? (
                <div className="mb-5 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            ) : null}
            {success ? (
                <div className="mb-5 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Contact channels saved and the public cache was refreshed.
                </div>
            ) : null}

            {profile ? (
                <form onSubmit={save} className="max-w-4xl space-y-6">
                    <section className="admin-glass rounded-xl p-6">
                        <div className="mb-5">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                Primary channels
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                                Used by the public Contact page, terminal
                                commands, and site identity.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>
                                    Public email
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={profile.email}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            email: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input
                                    value={profile.phone}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            phone: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="+91 00000 00000"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>GitHub URL</label>
                                <input
                                    type="url"
                                    value={profile.github ?? ""}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            github:
                                                event.target.value || undefined,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="https://github.com/username"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    LinkedIn URL
                                </label>
                                <input
                                    type="url"
                                    value={profile.linkedin ?? ""}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            linkedin:
                                                event.target.value || undefined,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Resume URL</label>
                                <input
                                    value={profile.resume}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            resume: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="/resume.pdf"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="admin-glass rounded-xl p-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Additional links
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                                    Add channels such as YouTube, HackerRank, or
                                    a personal website.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addSocialLink}
                                className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                            >
                                <Plus className="h-4 w-4" />
                                Add link
                            </button>
                        </div>

                        <div className="space-y-3">
                            {profile.socialLinks.length === 0 ? (
                                <div className="border-y border-[var(--border-subtle)] py-8 text-center text-sm text-[var(--text-tertiary)]">
                                    No additional links configured.
                                </div>
                            ) : null}
                            {profile.socialLinks.map((link) => (
                                <div
                                    key={link.id}
                                    className="grid gap-3 border-b border-[var(--border-subtle)] pb-4 sm:grid-cols-[0.7fr_0.7fr_1.5fr_auto] sm:items-end"
                                >
                                    <div>
                                        <label className={labelClass}>
                                            Platform
                                        </label>
                                        <input
                                            required
                                            value={link.platform}
                                            onChange={(event) =>
                                                updateSocialLink(link.id, {
                                                    platform:
                                                        event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                            placeholder="YouTube"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Label
                                        </label>
                                        <input
                                            value={link.label ?? ""}
                                            onChange={(event) =>
                                                updateSocialLink(link.id, {
                                                    label:
                                                        event.target.value ||
                                                        undefined,
                                                })
                                            }
                                            className={inputClass}
                                            placeholder="Channel"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            URL
                                        </label>
                                        <input
                                            required
                                            type="url"
                                            value={link.url}
                                            onChange={(event) =>
                                                updateSocialLink(link.id, {
                                                    url: event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeSocialLink(link.id)
                                        }
                                        title="Remove link"
                                        aria-label={`Remove ${link.platform} link`}
                                        className="flex h-[42px] w-[42px] items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

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
                            {saving ? "Saving…" : "Save Contact"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="rounded-lg border border-[var(--border-default)] p-8 text-sm text-[var(--text-tertiary)]">
                    The public profile is not initialized.
                </div>
            )}
        </>
    );
}
