"use client";

/**
 * Awards management page — list + create/delete achievements.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@/components/admin/GenericEntityList";
import type { AdminColumn } from "@/components/admin/AdminDataTable";
import type { Award } from "@/lib/admin/types";

const columns: AdminColumn<Award>[] = [
    {
        key: "title",
        label: "Title",
        sortable: true,
        render: (a) => (
            <span className="font-medium text-[var(--text-primary)]">
                {a.title}
            </span>
        ),
    },
    { key: "tier", label: "Tier", sortable: true, render: (a) => a.tier },
    { key: "date", label: "Date", sortable: true, render: (a) => a.date },
    {
        key: "category",
        label: "Category",
        sortable: true,
        render: (a) => a.category,
    },
];

const createFields: CreateField[] = [
    { key: "title", label: "Title", required: true, placeholder: "AWS Hero" },
    {
        key: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Award description…",
    },
    { key: "date", label: "Date", required: true, placeholder: "2024-01" },
    {
        key: "tier",
        label: "Tier",
        type: "select",
        options: ["legendary", "epic", "rare", "common"],
        required: true,
    },
    { key: "category", label: "Category", placeholder: "General" },
    { key: "icon", label: "Icon", placeholder: "Award" },
];

export default function AdminAwardsPage() {
    return (
        <GenericEntityList<Award>
            title="Awards"
            description="Manage your awards and achievements."
            fetchUrl="/api/admin/awards"
            columns={columns}
            rowKey={(a) => a.id}
            createFields={createFields}
            entityLabel="award"
        />
    );
}
