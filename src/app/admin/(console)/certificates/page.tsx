"use client";

/**
 * Certificates management page — list + create/delete certificates.
 */

import {
    GenericEntityList,
    type CreateField,
} from "@features/admin/components/GenericEntityList";
import type { AdminColumn } from "@features/admin/components/AdminDataTable";
import type { Certificate } from "@backend/schemas/types";

const columns: AdminColumn<Certificate>[] = [
    {
        key: "title",
        label: "Title",
        sortable: true,
        render: (c) => (
            <span className="font-medium text-[var(--text-primary)]">
                {c.title}
            </span>
        ),
    },
    { key: "issuer", label: "Issuer", sortable: true, render: (c) => c.issuer },
    {
        key: "issueDate",
        label: "Issued",
        sortable: true,
        render: (c) => c.issueDate,
    },
    {
        key: "expiryDate",
        label: "Expires",
        render: (c) => c.expiryDate ?? "Never",
    },
];

const createFields: CreateField[] = [
    {
        key: "title",
        label: "Title",
        required: true,
        placeholder: "AWS Solutions Architect",
    },
    {
        key: "issuer",
        label: "Issuer",
        required: true,
        placeholder: "Amazon Web Services",
    },
    {
        key: "issueDate",
        label: "Issue Date",
        required: true,
        placeholder: "2024-01",
    },
    { key: "credentialId", label: "Credential ID", placeholder: "AWS-12345" },
    {
        key: "credentialUrl",
        label: "Credential URL",
        placeholder: "https://...",
    },
];

export default function AdminCertificatesPage() {
    return (
        <GenericEntityList<Certificate>
            title="Certificates"
            description="Manage your certifications and credentials."
            fetchUrl="/api/admin/certificates"
            columns={columns}
            rowKey={(c) => c.id}
            createFields={createFields}
            entityLabel="certificate"
        />
    );
}
