"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import { ProfileImageField } from "@features/admin/components/ProfileImageField";
import type { MediaAsset, Profile } from "@backend/schemas/types";

const inputClass =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

export default function AdminAboutPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileImage, setProfileImage] = useState<MediaAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/profile");
            if (!response.ok) throw new Error("Failed to load About content.");
            const nextProfile: Profile = await response.json();
            setProfile(nextProfile);

            if (nextProfile.profileImageId) {
                const imageResponse = await fetch(
                    `/api/admin/media/${nextProfile.profileImageId}`,
                );
                setProfileImage(
                    imageResponse.ok ? await imageResponse.json() : null,
                );
            }
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to load About content.",
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
                    name: profile.name,
                    designation: profile.designation,
                    bio: profile.bio,
                    profileImageId: profileImage?.id ?? null,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    payload.error || "Failed to save About content.",
                );
            }
            setProfile(payload as Profile);
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 3000);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to save About content.",
            );
        } finally {
            setSaving(false);
        }
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
                title="About"
                description="Manage the identity, portrait, designation, and biography shown across the public site."
                actions={
                    <Link
                        href="/about"
                        target="_blank"
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View page
                    </Link>
                }
            />

            {error ? (
                <div className="mb-5 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            ) : null}
            {success ? (
                <div className="mb-5 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    About content saved and the public cache was refreshed.
                </div>
            ) : null}

            {profile ? (
                <form onSubmit={save} className="max-w-3xl space-y-6">
                    <section className="admin-glass rounded-xl p-6">
                        <div className="mb-5">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                Public identity
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                                These fields power the hero, About terminal
                                context, metadata, and contact identity.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <ProfileImageField
                                value={profileImage}
                                onChange={setProfileImage}
                                help="Select the portrait used by the public hero and About experience."
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        Display name
                                    </label>
                                    <input
                                        required
                                        value={profile.name}
                                        onChange={(event) =>
                                            setProfile({
                                                ...profile,
                                                name: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Designation
                                    </label>
                                    <input
                                        value={profile.designation}
                                        onChange={(event) =>
                                            setProfile({
                                                ...profile,
                                                designation: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                        placeholder="DevOps Engineer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Biography</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(event) =>
                                        setProfile({
                                            ...profile,
                                            bio: event.target.value,
                                        })
                                    }
                                    rows={8}
                                    className={inputClass}
                                    placeholder="Write a concise professional biography…"
                                />
                                <p className="mt-1.5 text-xs text-[var(--text-quaternary)]">
                                    {profile.bio.length} characters
                                </p>
                            </div>
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
                            {saving ? "Saving…" : "Save About"}
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
