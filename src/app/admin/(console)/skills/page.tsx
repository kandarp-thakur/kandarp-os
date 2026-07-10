"use client";

/**
 * Skills management page — list + create/delete skill mesh nodes.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@/components/admin/GenericEntityList";
import type { AdminColumn } from "@/components/admin/AdminDataTable";
import type { Skill } from "@/lib/admin/types";

const columns: AdminColumn<Skill>[] = [
    {
        key: "name",
        label: "Name",
        sortable: true,
        render: (s) => (
            <span className="font-medium text-[var(--text-primary)]">
                {s.name}
            </span>
        ),
    },
    { key: "domain", label: "Domain", sortable: true, render: (s) => s.domain },
    {
        key: "level",
        label: "Level",
        sortable: true,
        render: (s) => `${s.level}%`,
    },
    {
        key: "years",
        label: "Years",
        sortable: true,
        render: (s) => `${s.years}y`,
    },
    { key: "status", label: "Status", sortable: true, render: (s) => s.status },
];

const createFields: CreateField[] = [
    { key: "name", label: "Name", required: true, placeholder: "Kubernetes" },
    { key: "slug", label: "Slug", required: true, placeholder: "kubernetes" },
    {
        key: "domain",
        label: "Domain",
        type: "select",
        options: ["frontend", "backend", "devops", "data", "design"],
        required: true,
    },
    {
        key: "level",
        label: "Level (0-100)",
        type: "number",
        required: true,
        placeholder: "85",
    },
    {
        key: "years",
        label: "Years",
        type: "number",
        required: true,
        placeholder: "3",
    },
    {
        key: "tagline",
        label: "Tagline",
        placeholder: "Container orchestration",
    },
];

export default function AdminSkillsPage() {
    return (
        <GenericEntityList<Skill>
            title="Skills"
            description="Manage your skill mesh nodes."
            fetchUrl="/api/admin/skills"
            columns={columns}
            rowKey={(s) => s.id}
            createFields={createFields}
            entityLabel="skill"
        />
    );
}
