"use client";

/**
 * Notifications page — manage notification email recipients + view the
 * recent activity feed.
 *
 * The notification recipients live on the Settings singleton
 * (`settings.notificationEmails`). This page lets the admin add/remove
 * recipient emails and PATCHes the array back via /api/admin/settings.
 * It also surfaces the recent activity log so admins can see what
 * triggers notifications.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bell, Loader2, Mail, Plus, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ActivityLog, Settings } from "@/lib/admin/types";

export default function AdminNotificationsPage() {
    const [emails, setEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [settingsRes, activityRes] = await Promise.all([
                fetch("/api/admin/settings"),
                fetch("/api/admin/activity-logs?pageSize=20"),
            ]);
            if (settingsRes.ok) {
                const s: Settings = await settingsRes.json();
                setEmails(s.notificationEmails ?? []);
            }
            if (activityRes.ok) {
                const data = await activityRes.json();
                setActivity(data.rows ?? []);
            }
        } catch {
            setError("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const addEmail = () => {
        const trimmed = newEmail.trim().toLowerCase();
        if (!trimmed || emails.includes(trimmed)) return;
        setEmails((prev) => [...prev, trimmed]);
        setNewEmail("");
    };

    const removeEmail = (email: string) =>
        setEmails((prev) => prev.filter((e) => e !== email));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ notificationEmails: emails }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save notifications.");
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

    return (
        <>
            <AdminPageHeader
                title="Notifications"
                description="Manage email recipients for system alerts and review the activity feed."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Notification settings saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* ── Recipients ─────────────────────────────────────── */}
                    <form
                        onSubmit={handleSubmit}
                        className="admin-glass rounded-xl p-6"
                    >
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Mail className="h-4 w-4 text-[var(--accent-solid)]" />
                            Email Recipients
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            These addresses receive system alerts (errors,
                            backups, security events).
                        </p>

                        <div className="mb-4 flex gap-2">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addEmail();
                                    }
                                }}
                                placeholder="name@example.com"
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={addEmail}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>

                        <ul className="mb-4 space-y-2">
                            {emails.length === 0 ? (
                                <li className="rounded-lg bg-[var(--canvas-sunken)] px-3 py-3 text-center text-sm text-[var(--text-tertiary)]">
                                    No recipients yet.
                                </li>
                            ) : (
                                emails.map((email) => (
                                    <li
                                        key={email}
                                        className="flex items-center gap-2 rounded-lg bg-[var(--canvas-sunken)] px-3 py-2"
                                    >
                                        <Mail className="h-3.5 w-3.5 text-[var(--text-quaternary)]" />
                                        <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
                                            {email}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeEmail(email)}
                                            className="rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Recipients
                        </button>
                    </form>

                    {/* ── Activity feed ───────────────────────────────────── */}
                    <div className="admin-glass rounded-xl p-6">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Bell className="h-4 w-4 text-[var(--accent-solid)]" />
                            Recent Activity
                        </h2>
                        <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                            The latest events that may trigger notifications.
                        </p>
                        {activity.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                                No activity yet.
                            </p>
                        ) : (
                            <ul className="space-y-2.5">
                                {activity.map((log) => (
                                    <li
                                        key={log.id}
                                        className="flex items-start gap-3"
                                    >
                                        <div
                                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                                log.level === "error"
                                                    ? "bg-[var(--error)]"
                                                    : log.level === "warning"
                                                      ? "bg-[var(--warning)]"
                                                      : log.level === "success"
                                                        ? "bg-[var(--success)]"
                                                        : "bg-[var(--text-quaternary)]"
                                            }`}
                                        />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm text-[var(--text-primary)]">
                                                <span className="font-medium">
                                                    {log.userName}
                                                </span>{" "}
                                                <span className="text-[var(--text-tertiary)]">
                                                    {log.action}
                                                </span>
                                            </p>
                                            <p className="text-xs text-[var(--text-quaternary)]">
                                                {new Date(
                                                    log.timestamp,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
