"use client";

/**
 * Experience management page — list + create/delete deployments.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@features/admin/components/GenericEntityList";
import type { AdminColumn } from "@features/admin/components/AdminDataTable";
import { AdminStatusBadge } from "@features/admin/components/AdminStatusBadge";
import type { Experience } from "@backend/schemas/types";

const columns: AdminColumn<Experience>[] = [
    {
        key: "role",
        label: "Role",
        sortable: true,
        render: (e) => (
            <span className="font-medium text-[var(--text-primary)]">
                {e.role}
            </span>
        ),
    },
    {
        key: "company",
        label: "Company",
        sortable: true,
        render: (e) => e.company,
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (e) => <AdminStatusBadge status={e.status} />,
    },
    {
        key: "startDate",
        label: "Start",
        sortable: true,
        render: (e) => e.startDate,
    },
    { key: "endDate", label: "End", render: (e) => e.endDate ?? "Present" },
];

const createFields: CreateField[] = [
    {
        key: "role",
        label: "Role",
        required: true,
        placeholder: "Senior DevOps Engineer",
    },
    {
        key: "company",
        label: "Company",
        required: true,
        placeholder: "Acme Corp",
    },
    {
        key: "summary",
        label: "Summary",
        type: "textarea",
        required: true,
        placeholder: "Brief role summary…",
    },
    {
        key: "startDate",
        label: "Start Date",
        required: true,
        placeholder: "2023-01",
    },
    {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "completed"],
        required: true,
    },
];

export default function AdminExperiencePage() {
    return (
        <GenericEntityList<Experience>
            title="Experience"
            description="Manage your work experience and deployments."
            fetchUrl="/api/admin/experience"
            columns={columns}
            rowKey={(e) => e.id}
            createFields={createFields}
            entityLabel="experience"
        />
    );
}
