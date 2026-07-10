"use client";

/**
 * Blog list page — the admin table view of all blog posts.
 */

import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { BlogPost } from "@/lib/admin/types";

const columns: AdminColumn<BlogPost>[] = [
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
        key: "readingTime",
        label: "Read Time",
        sortable: true,
        render: (p) => `${p.readingTime} min`,
    },
    {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        render: (p) => new Date(p.updatedAt).toLocaleDateString(),
    },
];

export default function AdminBlogPage() {
    return (
        <>
            <AdminPageHeader
                title="Blog"
                description="Manage your blog posts and articles."
                actions={
                    <Link
                        href="/admin/blog/new"
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        New Post
                    </Link>
                }
            />
            <AdminDataTable<BlogPost>
                columns={columns}
                fetchUrl="/api/admin/blog"
                rowKey={(p) => p.id}
                rowHref={(p) => `/admin/blog/${p.id}`}
                emptyMessage="No blog posts yet. Click New Post to create one."
            />
        </>
    );
}
