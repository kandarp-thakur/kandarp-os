"use client";

/**
 * System Health page — runtime + data-store health monitoring.
 *
 * Surfaces process metrics (memory, uptime, environment), data-store
 * collection counts, and recent error/warning activity logs. Runtime
 * metrics are fetched from /api/admin/dashboard (which returns process
 * stats); collection counts come from the same endpoint; recent errors
 * come from /api/admin/activity-logs.
 */

import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Cpu,
    Database,
    HeartPulse,
    Loader2,
    RefreshCw,
    Server,
    Timer,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ActivityLog } from "@/lib/admin/types";

interface HealthSnapshot {
    environment: string;
    memoryMb: number;
    uptimeMin: number;
    timestamp: string;
}

interface CollectionStat {
    name: string;
    count: number;
}

export default function AdminSystemHealthPage() {
    const [health, setHealth] = useState<HealthSnapshot | null>(null);
    const [collections, setCollections] = useState<CollectionStat[]>([]);
    const [errors, setErrors] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            // The dashboard API returns aggregate stats; we reuse it for
            // process metrics. We also pull activity logs for errors.
            const [dashRes, logRes] = await Promise.all([
                fetch("/api/admin/dashboard"),
                fetch(
                    "/api/admin/activity-logs?pageSize=50&sort=timestamp&order=desc",
                ),
            ]);

            if (dashRes.ok) {
                const dash = await dashRes.json();
                const sys = dash.system ?? {};
                setHealth({
                    environment:
                        sys.nodeEnv ??
                        process.env.NODE_ENV ??
                        "development",
                    memoryMb: sys.memoryMB ?? 0,
                    uptimeMin: Math.round((sys.uptime ?? 0) / 60),
                    timestamp: new Date().toISOString(),
                });
                // The dashboard returns counts as a { name: count } map.
                const counts = dash.counts ?? {};
                setCollections(
                    Object.entries(counts).map(([name, count]) => ({
                        name,
                        count: Number(count) || 0,
                    })),
                );
            }

            if (logRes.ok) {
                const data = await logRes.json();
                const logs: ActivityLog[] = data.rows ?? [];
                setErrors(
                    logs.filter(
                        (l) => l.level === "error" || l.level === "warning",
                    ),
                );
            }
        } catch {
            setError("Failed to load system health.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void fetchAll();
        // Auto-refresh every 30s.
        const interval = setInterval(() => void fetchAll(true), 30000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const metrics = health
        ? [
            {
                label: "Status",
                value: "Operational",
                icon: CheckCircle,
                tint: "text-[var(--success)]",
            },
            {
                label: "Environment",
                value: health.environment,
                icon: Server,
                tint: "text-[var(--accent-solid)]",
            },
            {
                label: "Memory (RSS)",
                value: `${health.memoryMb} MB`,
                icon: Cpu,
                tint: "text-[var(--info)]",
            },
            {
                label: "Uptime",
                value: `${health.uptimeMin} min`,
                icon: Timer,
                tint: "text-[var(--warning)]",
            },
        ]
        : [];

    return (
        <>
            <AdminPageHeader
                title="System Health"
                description="Real-time runtime, data-store, and error monitoring."
                actions={
                    <button
                        onClick={() => void fetchAll(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)] disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
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
            ) : (
                <>
                    {/* ── Runtime metrics ─────────────────────────────────── */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                        {metrics.map((m) => {
                            const Icon = m.icon;
                            return (
                                <div
                                    key={m.label}
                                    className="admin-glass rounded-xl p-5"
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${m.tint}`} />
                                        <span className="text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                            {m.label}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                                        {m.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* ── Data store ───────────────────────────────────── */}
                        <div className="admin-glass rounded-xl p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                                <Database className="h-4 w-4 text-[var(--accent-solid)]" />
                                Data Store
                            </h2>
                            {collections.length === 0 ? (
                                <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
                                    No collection stats available.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {collections.map((c) => (
                                        <li
                                            key={c.name}
                                            className="flex items-center justify-between rounded-lg bg-[var(--canvas-sunken)] px-3 py-2"
                                        >
                                            <span className="font-mono text-xs text-[var(--text-secondary)]">
                                                {c.name}
                                            </span>
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                {c.count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* ── Recent errors ────────────────────────────────── */}
                        <div className="admin-glass rounded-xl p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                                <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                                Recent Errors & Warnings
                            </h2>
                            {errors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <HeartPulse className="mb-2 h-8 w-8 text-[var(--success)]" />
                                    <p className="text-sm text-[var(--text-tertiary)]">
                                        No errors or warnings. All systems
                                        nominal.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-2.5">
                                    {errors.map((log) => (
                                        <li
                                            key={log.id}
                                            className="flex items-start gap-3"
                                        >
                                            <div
                                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${log.level === "error"
                                                    ? "bg-[var(--error)]"
                                                    : "bg-[var(--warning)]"
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
                                                {log.details && (
                                                    <p className="truncate text-xs text-[var(--text-quaternary)]">
                                                        {log.details}
                                                    </p>
                                                )}
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

                    <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-quaternary)]">
                        <Activity className="h-3 w-3" />
                        Auto-refreshes every 30 seconds. Last updated{" "}
                        {health
                            ? new Date(health.timestamp).toLocaleTimeString()
                            : "—"}
                        .
                    </p>
                </>
            )}
        </>
    );
}
