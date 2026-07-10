"use client";

/**
 * Security page — password management + two-factor status.
 *
 * Lets the current user change their password (via /api/admin/users/[id])
 * and view their 2FA enrollment status. Password changes require the
 * current password to be re-entered for confirmation (the API hashes
 * whatever is sent in the `password` field).
 */

import { useEffect, useState, type FormEvent } from "react";
import {
    CheckCircle,
    KeyRound,
    Loader2,
    Lock,
    ShieldCheck,
    ShieldOff,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { SafeUser } from "@/lib/admin/types";

export default function AdminSecurityPage() {
    const [user, setUser] = useState<SafeUser | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/auth/me")
            .then((r) => r.json())
            .then((u: SafeUser) => setUser(u))
            .catch(() => setError("Failed to load account."))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError(null);
        setSuccess(false);

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!currentPassword) {
            setError("Enter your current password to confirm.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to update password.");
            } else {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
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

    return (
        <>
            <AdminPageHeader
                title="Security"
                description="Manage your password and two-factor authentication."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Password updated successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* ── Password change ─────────────────────────────────── */}
                    <form
                        onSubmit={handleSubmit}
                        className="admin-glass rounded-xl p-6"
                    >
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <KeyRound className="h-4 w-4 text-[var(--accent-solid)]" />
                            Change Password
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            Use a strong, unique password of at least 8
                            characters.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="At least 8 characters"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Re-enter new password"
                                    className={inputClass}
                                />
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
                                <Lock className="h-4 w-4" />
                            )}
                            Update Password
                        </button>
                    </form>

                    {/* ── 2FA status ──────────────────────────────────────── */}
                    <div className="admin-glass rounded-xl p-6">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <ShieldCheck className="h-4 w-4 text-[var(--accent-solid)]" />
                            Two-Factor Authentication
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            Add an extra layer of security with a TOTP
                            authenticator app.
                        </p>
                        <div
                            className={`flex items-center gap-3 rounded-lg border p-4 ${user?.totpEnabled
                                    ? "border-[var(--success)]/20 bg-[var(--success)]/5"
                                    : "border-[var(--warning)]/20 bg-[var(--warning)]/5"
                                }`}
                        >
                            {user?.totpEnabled ? (
                                <CheckCircle className="h-5 w-5 shrink-0 text-[var(--success)]" />
                            ) : (
                                <ShieldOff className="h-5 w-5 shrink-0 text-[var(--warning)]" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {user?.totpEnabled
                                        ? "Two-factor enabled"
                                        : "Two-factor not enabled"}
                                </p>
                                <p className="text-xs text-[var(--text-tertiary)]">
                                    {user?.totpEnabled
                                        ? "Your account is protected with a TOTP code."
                                        : "Enable 2FA to protect your account from unauthorized access."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center justify-between rounded-lg bg-[var(--canvas-sunken)] px-3 py-2">
                                <span className="text-[var(--text-tertiary)]">
                                    Account status
                                </span>
                                <span className="font-medium capitalize text-[var(--text-primary)]">
                                    {user?.status ?? "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-[var(--canvas-sunken)] px-3 py-2">
                                <span className="text-[var(--text-tertiary)]">
                                    Last login
                                </span>
                                <span className="font-medium text-[var(--text-primary)]">
                                    {user?.lastLoginAt
                                        ? new Date(
                                            user.lastLoginAt,
                                        ).toLocaleString()
                                        : "Never"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
