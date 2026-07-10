"use client";

/**
 * Forms page — review contact-form submissions.
 *
 * Contact submissions are recorded as analytics events of type
 * `contact_submit` (the public contact form POSTs to /api/admin/analytics).
 * This page lists those submissions in a table with the sender's details
 * and message, and supports deleting individual submissions.
 */

import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Mail, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { AnalyticsEvent } from "@/lib/admin/types";

interface SubmissionRow {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    timestamp: string;
    raw: AnalyticsEvent;
}

function toRow(ev: AnalyticsEvent): SubmissionRow {
    const meta = (ev.meta ?? {}) as Record<string, unknown>;
    return {
        id: ev.id,
        name: String(meta.name ?? ""),
        email: String(meta.email ?? ""),
        subject: String(meta.subject ?? ""),
        message: String(meta.message ?? ""),
        timestamp: ev.timestamp,
        raw: ev,
    };
}

export default function AdminFormsPage() {
    const [rows, setRows] = useState<SubmissionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<SubmissionRow | null>(null);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch a large page of analytics and filter client-side for
            // contact_submit events. The analytics API supports search but
            // not type filtering, so we pull a generous page.
            const res = await fetch(
                "/api/admin/analytics?pageSize=500&sort=timestamp&order=desc",
            );
            if (!res.ok) {
                setError("Failed to load submissions.");
                return;
            }
            const data = await res.json();
            const events: AnalyticsEvent[] = data.rows ?? [];
            setRows(
                events
                    .filter((e) => e.type === "contact_submit")
                    .map(toRow),
            );
        } catch {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchSubmissions();
    }, [fetchSubmissions]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this submission?")) return;
        await fetch(`/api/admin/analytics/${id}`, { method: "DELETE" });
        setRows((prev) => prev.filter((r) => r.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    return (
        <>
            <AdminPageHeader
                title="Forms"
                description="Contact-form submissions captured from the public site."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : rows.length === 0 ? (
                <div className="admin-glass flex flex-col items-center justify-center rounded-xl p-12 text-center">
                    <Inbox className="mb-3 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No submissions yet
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        Contact-form messages will appear here.
                    </p>
                </div>
            ) : (
                <div className="admin-glass overflow-hidden rounded-xl">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)] text-left text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">
                                    Email
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Subject
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Received
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => setSelected(row)}
                                    className="cursor-pointer transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                                        {row.name || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                                        {row.email || "—"}
                                    </td>
                                    <td className="max-w-[260px] truncate px-4 py-3 text-[var(--text-secondary)]">
                                        {row.subject || row.message || "—"}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-tertiary)]">
                                        {new Date(
                                            row.timestamp,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(row.id);
                                            }}
                                            className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Submission detail drawer */}
            {selected && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    />
                    <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                                <Mail className="h-4 w-4 text-[var(--accent-solid)]" />
                                Submission
                            </h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                    From
                                </p>
                                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                                    {selected.name || "Unknown"}
                                </p>
                                <a
                                    href={`mailto:${selected.email}`}
                                    className="text-sm text-[var(--accent-solid)] hover:underline"
                                >
                                    {selected.email || "—"}
                                </a>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                    Subject
                                </p>
                                <p className="mt-1 text-sm text-[var(--text-primary)]">
                                    {selected.subject || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                    Message
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                                    {selected.message || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                    Received
                                </p>
                                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                                    {new Date(
                                        selected.timestamp,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-[var(--border-subtle)] p-4">
                            <a
                                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(
                                    selected.subject || "Your message",
                                )}`}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white"
                            >
                                <Mail className="h-4 w-4" />
                                Reply
                            </a>
                            <button
                                onClick={() => handleDelete(selected.id)}
                                className="flex items-center gap-2 rounded-lg border border-[var(--error)]/20 px-4 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/5"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
