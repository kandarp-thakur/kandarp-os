"use client";

/**
 * Analytics page — view analytics events.
 *
 * Renders the AdminDataTable wired to the analytics API. Shows event
 * type, path, referrer, device, and timestamp.
 */

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@features/admin/components/AdminDataTable";
import type { AnalyticsEvent } from "@backend/schemas/types";

const columns: AdminColumn<AnalyticsEvent>[] = [
    {
        key: "timestamp",
        label: "Time",
        sortable: true,
        render: (e) => new Date(e.timestamp).toLocaleString(),
    },
    {
        key: "type",
        label: "Type",
        sortable: true,
        render: (e) => (
            <span className="rounded-md bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--accent-solid)]">
                {e.type}
            </span>
        ),
    },
    {
        key: "path",
        label: "Path",
        sortable: true,
        render: (e) => (
            <span className="font-mono text-xs text-[var(--text-secondary)]">
                {e.path}
            </span>
        ),
    },
    {
        key: "referrer",
        label: "Referrer",
        render: (e) => (
            <span className="text-[var(--text-tertiary)]">
                {e.referrer || "—"}
            </span>
        ),
    },
    { key: "device", label: "Device", sortable: true, render: (e) => e.device },
    { key: "country", label: "Country", render: (e) => e.country || "—" },
];

export default function AdminAnalyticsPage() {
    return (
        <>
            <AdminPageHeader
                title="Analytics"
                description="Track visitor activity and engagement."
            />
            <AdminDataTable<AnalyticsEvent>
                columns={columns}
                fetchUrl="/api/admin/analytics"
                rowKey={(e) => e.id}
                emptyMessage="No analytics events recorded yet."
                pageSize={50}
            />
        </>
    );
}
