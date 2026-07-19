"use client";

/**
 * Services management page — list + create/delete services.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@features/admin/components/GenericEntityList";
import type { AdminColumn } from "@features/admin/components/AdminDataTable";
import type { Service } from "@backend/schemas/types";

const columns: AdminColumn<Service>[] = [
    {
        key: "title",
        label: "Title",
        sortable: true,
        render: (s) => (
            <span className="font-medium text-[var(--text-primary)]">
                {s.title}
            </span>
        ),
    },
    { key: "price", label: "Price", sortable: true, render: (s) => s.price },
    {
        key: "displayOrder",
        label: "Order",
        sortable: true,
        render: (s) => s.displayOrder,
    },
];

const createFields: CreateField[] = [
    {
        key: "title",
        label: "Title",
        required: true,
        placeholder: "Cloud Architecture Review",
    },
    {
        key: "slug",
        label: "Slug",
        required: true,
        placeholder: "cloud-architecture-review",
    },
    {
        key: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Service description…",
    },
    { key: "price", label: "Price", placeholder: "$500" },
    { key: "icon", label: "Icon", placeholder: "Wrench" },
];

export default function AdminServicesPage() {
    return (
        <GenericEntityList<Service>
            title="Services"
            description="Manage your offered services."
            fetchUrl="/api/admin/services"
            columns={columns}
            rowKey={(s) => s.id}
            createFields={createFields}
            entityLabel="service"
        />
    );
}
