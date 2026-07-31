"use client";

/**
 * Infrastructure management page — list + create/delete infra nodes.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@features/admin/components/GenericEntityList";
import type { AdminColumn } from "@features/admin/components/AdminDataTable";
import { AdminStatusBadge } from "@features/admin/components/AdminStatusBadge";
import type { InfraNode } from "@backend/schemas/types";

const columns: AdminColumn<InfraNode>[] = [
    {
        key: "name",
        label: "Name",
        sortable: true,
        render: (n) => (
            <span className="font-medium text-[var(--text-primary)]">
                {n.name}
            </span>
        ),
    },
    { key: "role", label: "Role", sortable: true, render: (n) => n.role },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (n) => <AdminStatusBadge status={n.status} />,
    },
    {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        render: (n) => new Date(n.updatedAt).toLocaleDateString(),
    },
];

const createFields: CreateField[] = [
    {
        key: "name",
        label: "Name",
        required: true,
        placeholder: "Production Cluster",
    },
    {
        key: "slug",
        label: "Slug",
        required: true,
        placeholder: "production-cluster",
    },
    {
        key: "role",
        label: "Role",
        required: true,
        placeholder: "Kubernetes Control Plane",
    },
    {
        key: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Node description…",
    },
    {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "standby", "maintenance"],
        required: true,
    },
    { key: "icon", label: "Icon", placeholder: "server" },
];

export default function AdminInfrastructurePage() {
    return (
        <GenericEntityList<InfraNode>
            title="Infrastructure"
            description="Manage your infrastructure topology nodes."
            fetchUrl="/api/admin/infrastructure"
            columns={columns}
            rowKey={(n) => n.id}
            createFields={createFields}
            entityLabel="node"
        />
    );
}
