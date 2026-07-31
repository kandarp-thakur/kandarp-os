"use client";

/**
 * Sessions page — view and revoke the current user's database-backed login
 * sessions through the dedicated self-service sessions API.
 */

import { useCallback, useEffect, useState } from "react";
import {
    Globe,
    Loader2,
    Monitor,
    MonitorSmartphone,
    Smartphone,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";

interface SessionEntry {
    token: string;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    ip: string;
    userAgent: string;
    rememberMe: boolean;
    isCurrent: boolean;
}

interface SessionsResponse {
    current: string;
    sessions: SessionEntry[];
}

function detectDevice(ua: string): { icon: typeof Monitor; label: string } {
    if (/mobile|android|iphone|ipad/i.test(ua))
        return { icon: Smartphone, label: "Mobile" };
    if (/tablet|ipad/i.test(ua))
        return { icon: MonitorSmartphone, label: "Tablet" };
    return { icon: Monitor, label: "Desktop" };
}

function parseBrowser(ua: string): string {
    if (/edg/i.test(ua)) return "Edge";
    if (/chrome|chromium|crios/i.test(ua)) return "Chrome";
    if (/firefox|fxios/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua)) return "Safari";
    return "Browser";
}

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<SessionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/auth/sessions", {
                cache: "no-store",
            });
            if (!res.ok) {
                setError("Failed to load active sessions.");
                return;
            }
            const data = (await res.json()) as SessionsResponse;
            setSessions(data.sessions);
        } catch {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleRevoke = async (token: string) => {
        if (!confirm("Revoke this session? The device will be signed out."))
            return;
        setRevoking(token);
        setError(null);
        try {
            const res = await fetch("/api/admin/auth/sessions", {
                method: "DELETE",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => null)) as {
                    error?: string;
                } | null;
                setError(body?.error ?? "Failed to revoke session.");
                return;
            }
            setSessions((current) =>
                current.filter((session) => session.token !== token),
            );
        } catch {
            setError("Failed to revoke session.");
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        if (
            !confirm(
                "Revoke ALL other sessions? You will stay signed in on this device.",
            )
        )
            return;
        setRevoking("all");
        setError(null);
        try {
            const res = await fetch("/api/admin/auth/sessions", {
                method: "DELETE",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => null)) as {
                    error?: string;
                } | null;
                setError(body?.error ?? "Failed to revoke sessions.");
                return;
            }
            setSessions((current) =>
                current.filter((session) => session.isCurrent),
            );
        } catch {
            setError("Failed to revoke sessions.");
        } finally {
            setRevoking(null);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Sessions"
                description="Devices currently signed in to your account."
                actions={
                    sessions.some((session) => !session.isCurrent) ? (
                        <button
                            onClick={handleRevokeAll}
                            disabled={revoking === "all"}
                            className="flex items-center gap-2 rounded-lg border border-[var(--error)]/20 px-3 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/5 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" />
                            Revoke All Others
                        </button>
                    ) : undefined
                }
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
            ) : sessions.length === 0 ? (
                <div className="admin-glass flex flex-col items-center justify-center rounded-xl p-12 text-center">
                    <MonitorSmartphone className="mb-3 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No active sessions
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        Session records will appear here when you sign in.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => {
                        const { icon: DeviceIcon, label } = detectDevice(
                            session.userAgent,
                        );
                        const browser = parseBrowser(session.userAgent);
                        return (
                            <div
                                key={session.token}
                                className="admin-glass flex items-center gap-4 rounded-xl p-4"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                    <DeviceIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                            {label} · {browser}
                                        </p>
                                        {session.isCurrent && (
                                            <span className="shrink-0 rounded-md bg-[var(--success)]/10 px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--success)]">
                                                This device
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--text-tertiary)]">
                                        <Globe className="h-3 w-3" />
                                        {session.ip || "Unknown IP"}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-[var(--text-quaternary)]">
                                        {session.userAgent || "Unknown browser"}
                                    </p>
                                    <p className="mt-0.5 text-xs text-[var(--text-quaternary)]">
                                        Last active{" "}
                                        {new Date(
                                            session.lastUsedAt,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                {!session.isCurrent && (
                                    <button
                                        onClick={() =>
                                            handleRevoke(session.token)
                                        }
                                        disabled={revoking === session.token}
                                        className="shrink-0 rounded-md p-2 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)] disabled:opacity-60"
                                    >
                                        {revoking === session.token ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
