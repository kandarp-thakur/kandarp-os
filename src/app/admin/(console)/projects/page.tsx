"use client";

/**
 * Projects list page — the admin table view of all projects.
 *
 * Renders the page header + the AdminDataTable wired to the projects
 * API. The "New Project" button links to the editor page.
 */

import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@features/admin/components/AdminDataTable";
import { AdminStatusBadge } from "@features/admin/components/AdminStatusBadge";
import type { Project } from "@backend/schemas/types";

const columns: AdminColumn<Project>[] = [
    {
        key: "title",
        label: "Title",
        sortable: true,
        render: (p) => (
            <span className="font-medium text-[var(--text-primary)]">
                {p.title}
            </span>
        ),
    },
    {
        key: "category",
        label: "Category",
        sortable: true,
        render: (p) => p.category,
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (p) => <AdminStatusBadge status={p.status} />,
    },
    {
        key: "featured",
        label: "Featured",
        render: (p) => (p.featured ? "★" : ""),
    },
    {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        render: (p) => new Date(p.updatedAt).toLocaleDateString(),
    },
];

export default function AdminProjectsPage() {
    return (
        <>
            <AdminPageHeader
                title="Projects"
                description="Manage your project portfolio."
                actions={
                    <Link
                        href="/admin/projects/new"
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        New Project
                    </Link>
                }
            />
            <AdminDataTable<Project>
                columns={columns}
                fetchUrl="/api/admin/projects"
                rowKey={(p) => p.id}
                rowHref={(p) => `/admin/projects/${p.id}`}
                emptyMessage="No projects yet. Click New Project to create one."
            />
        </>
    );
}
