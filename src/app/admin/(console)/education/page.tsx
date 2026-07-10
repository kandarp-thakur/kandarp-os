"use client";

/**
 * Education management page — list + create/delete education entries.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@/components/admin/GenericEntityList";
import type { AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { Education } from "@/lib/admin/types";

const columns: AdminColumn<Education>[] = [
    {
        key: "institution",
        label: "Institution",
        sortable: true,
        render: (e) => (
            <span className="font-medium text-[var(--text-primary)]">
                {e.institution}
            </span>
        ),
    },
    { key: "degree", label: "Degree", sortable: true, render: (e) => e.degree },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (e) => <AdminStatusBadge status={e.status} />,
    },
    { key: "endDate", label: "End", render: (e) => e.endDate ?? "Ongoing" },
];

const createFields: CreateField[] = [
    {
        key: "institution",
        label: "Institution",
        required: true,
        placeholder: "University of Technology",
    },
    {
        key: "degree",
        label: "Degree",
        required: true,
        placeholder: "B.Tech Computer Science",
    },
    { key: "field", label: "Field", placeholder: "Computer Science" },
    {
        key: "startDate",
        label: "Start Date",
        required: true,
        placeholder: "2016-08",
    },
    {
        key: "status",
        label: "Status",
        type: "select",
        options: ["ongoing", "completed"],
        required: true,
    },
    { key: "grade", label: "Grade", placeholder: "8.5 CGPA" },
    {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Additional details…",
    },
];

export default function AdminEducationPage() {
    return (
        <GenericEntityList<Education>
            title="Education"
            description="Manage your education history."
            fetchUrl="/api/admin/education"
            columns={columns}
            rowKey={(e) => e.id}
            createFields={createFields}
            entityLabel="education"
        />
    );
}
