"use client";

/**
 * Activity Logs page — read-only audit trail.
 *
 * Renders the AdminDataTable wired to the activity-logs API. Shows
 * timestamp, user, action, entity, and level.
 */

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@/components/admin/AdminDataTable";
import type { ActivityLog } from "@/lib/admin/types";

const columns: AdminColumn<ActivityLog>[] = [
    {
        key: "timestamp",
        label: "Time",
        sortable: true,
        render: (l) => new Date(l.timestamp).toLocaleString(),
    },
    {
        key: "userName",
        label: "User",
        sortable: true,
        render: (l) => (
            <span className="font-medium text-[var(--text-primary)]">
                {l.userName}
            </span>
        ),
    },
    { key: "action", label: "Action", sortable: true, render: (l) => l.action },
    { key: "entity", label: "Entity", sortable: true, render: (l) => l.entity },
    {
        key: "details",
        label: "Details",
        render: (l) => (
            <span className="text-[var(--text-tertiary)]">{l.details}</span>
        ),
    },
    {
        key: "level",
        label: "Level",
        sortable: true,
        render: (l) => {
            const colors: Record<string, string> = {
                info: "text-[var(--text-tertiary)]",
                success: "text-[var(--success)]",
                warning: "text-[var(--warning)]",
                error: "text-[var(--error)]",
            };
            return (
                <span
                    className={`text-xs font-medium uppercase ${colors[l.level] ?? ""}`}
                >
                    {l.level}
                </span>
            );
        },
    },
];

export default function AdminActivityLogsPage() {
    return (
        <>
            <AdminPageHeader
                title="Activity Logs"
                description="Audit trail of all admin actions."
            />
            <AdminDataTable<ActivityLog>
                columns={columns}
                fetchUrl="/api/admin/activity-logs"
                rowKey={(l) => l.id}
                emptyMessage="No activity logged yet."
                pageSize={50}
            />
        </>
    );
}
