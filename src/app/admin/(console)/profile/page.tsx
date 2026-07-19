"use client";

/**
 * Profile page — the current user's account settings + the public Profile
 * (hero portrait, name, designation, bio, contact links).
 *
 * Two concerns live here:
 *  1. **Account** — name, email, avatar, password (saved to the user record
 *     via `/api/admin/users/[id]`). Read-only role display.
 *  2. **Public Profile** — the singleton Profile entity that drives the hero
 *     section and contact info on the public site (saved to
 *     `/api/admin/profile`). The Profile Image field uses the reusable
 *     `ProfileImageField` (Media Library picker + crop + focal point).
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import { ProfileImageField } from "@features/admin/components/ProfileImageField";
import { ROLE_LABELS } from "@backend/permissions/rbac";
import type { MediaAsset, Profile, SafeUser } from "@backend/schemas/types";

export default function AdminProfilePage() {
    /* ── Account state ──────────────────────────────────────────────────── */
    const [user, setUser] = useState<SafeUser | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [password, setPassword] = useState("");
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [accountSuccess, setAccountSuccess] = useState(false);

    /* ── Public Profile state ───────────────────────────────────────────── */
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileImage, setProfileImage] = useState<MediaAsset | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/auth/me")
            .then((r) => r.json())
            .then((u: SafeUser) => {
                setUser(u);
                setName(u.name);
                setEmail(u.email);
                setAvatar(u.avatar ?? "");
            })
            .catch(() => setAccountError("Failed to load account."));
        void loadProfile();
    }, []);

    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/profile");
            if (!res.ok) {
                setProfileError("Failed to load profile.");
                return;
            }
            const p: Profile = await res.json();
            setProfile(p);
            // Resolve the current profile image asset (if any) for the field.
            if (p.profileImageId) {
                const assetRes = await fetch(
                    `/api/admin/media/${p.profileImageId}`,
                );
                if (assetRes.ok) {
                    setProfileImage(await assetRes.json());
                } else {
                    setProfileImage(null);
                }
            } else {
                setProfileImage(null);
            }
        } catch {
            setProfileError("Failed to load profile.");
        }
    }, []);

    const handleAccountSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAccountSaving(true);
        setAccountError(null);
        setAccountSuccess(false);

        const payload: Record<string, unknown> = {
            name,
            email: email.toLowerCase(),
            avatar: avatar || undefined,
        };
        if (password) payload.password = password;

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setAccountError(data.error ?? "Failed to save account.");
            } else {
                setPassword("");
                setAccountSuccess(true);
                setTimeout(() => setAccountSuccess(false), 3000);
            }
        } catch {
            setAccountError("Network error.");
        } finally {
            setAccountSaving(false);
        }
    };

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setProfileSaving(true);
        setProfileError(null);
        setProfileSuccess(false);

        const payload: Partial<Profile> = {
            name: profile.name,
            designation: profile.designation,
            bio: profile.bio,
            profileImageId: profileImage?.id ?? null,
            email: profile.email,
            phone: profile.phone,
            github: profile.github,
            linkedin: profile.linkedin,
            resume: profile.resume,
            socialLinks: profile.socialLinks,
        };

        try {
            const res = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setProfileError(data.error ?? "Failed to save profile.");
            } else {
                const updated: Profile = await res.json();
                setProfile(updated);
                setProfileSuccess(true);
                setTimeout(() => setProfileSuccess(false), 3000);
            }
        } catch {
            setProfileError("Network error.");
        } finally {
            setProfileSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

    if (!user || !profile) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="Profile"
                description="Manage your account and public profile (hero portrait, bio, contact)."
            />

            {/* ── Public Profile (hero portrait + bio + contact) ──────────── */}
            <form
                onSubmit={handleProfileSubmit}
                className="mb-8 max-w-2xl space-y-6"
            >
                {profileError && (
                    <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                        {profileError}
                    </div>
                )}
                {profileSuccess && (
                    <div className="rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                        Profile saved successfully. The hero portrait updates on
                        the public site.
                    </div>
                )}

                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Public Profile
                    </h2>
                    <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                        This information appears in the hero section and contact
                        area of the public site.
                    </p>

                    <div className="space-y-4">
                        <ProfileImageField
                            value={profileImage}
                            onChange={setProfileImage}
                            help="Choose an image from the Media Library. The hero portrait updates automatically. Use Crop and Focal Point to refine how it fits the frame."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Name</label>
                                <input
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            name: e.target.value,
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
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            designation: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="e.g. Senior DevOps Engineer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) =>
                                    setProfile({
                                        ...profile,
                                        bio: e.target.value,
                                    })
                                }
                                rows={4}
                                className={inputClass}
                                placeholder="A short professional bio…"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>
                                    Public Email
                                </label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            email: e.target.value,
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
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            phone: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="+1 555 000 0000"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>GitHub</label>
                                <input
                                    type="url"
                                    value={profile.github ?? ""}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            github: e.target.value || undefined,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="https://github.com/you"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>LinkedIn</label>
                                <input
                                    type="url"
                                    value={profile.linkedin ?? ""}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            linkedin:
                                                e.target.value || undefined,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="https://linkedin.com/in/you"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Resume URL</label>
                                <input
                                    value={profile.resume}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            resume: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="/resume.pdf"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {profileSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {profileSaving ? "Saving…" : "Save Profile"}
                    </button>
                </div>
            </form>

            {/* ── Account settings ────────────────────────────────────────── */}
            <form
                onSubmit={handleAccountSubmit}
                className="max-w-2xl space-y-6"
            >
                {accountError && (
                    <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                        {accountError}
                    </div>
                )}
                {accountSuccess && (
                    <div className="rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                        Account saved successfully.
                    </div>
                )}

                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Account Info
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Avatar URL</label>
                            <input
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                className={inputClass}
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Role</label>
                            <div className="flex h-[42px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--canvas-sunken)] px-3.5 text-sm text-[var(--text-tertiary)]">
                                {ROLE_LABELS[user.role]} — managed by an owner
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Change Password
                    </h2>
                    <div>
                        <label className={labelClass}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            className={inputClass}
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={accountSaving}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {accountSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {accountSaving ? "Saving…" : "Save Account"}
                    </button>
                </div>
            </form>
        </>
    );
}
