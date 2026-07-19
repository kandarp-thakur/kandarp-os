"use client";

/**
 * Project editor — create/edit a project.
 *
 * A form-driven editor that handles both new and existing projects.
 * On submit, POSTs (create) or PATCHes (update) to the projects API.
 * Supports all project fields including SEO metadata.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { Project } from "@backend/schemas/types";

interface ProjectEditorProps {
    projectId?: string;
}

interface FormState {
    title: string;
    slug: string;
    description: string;
    longDescription: string;
    category: string;
    stack: string;
    tags: string;
    githubUrl: string;
    liveUrl: string;
    status: string;
    featured: boolean;
    displayOrder: number;
}

const emptyForm: FormState = {
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    category: "General",
    stack: "",
    tags: "",
    githubUrl: "",
    liveUrl: "",
    status: "draft",
    featured: false,
    displayOrder: 0,
};

export function ProjectEditor({ projectId }: ProjectEditorProps) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [loading, setLoading] = useState(!!projectId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) return;
        fetch(`/api/admin/projects/${projectId}`)
            .then((r) => r.json())
            .then((p: Project) => {
                setForm({
                    title: p.title,
                    slug: p.slug,
                    description: p.description,
                    longDescription: p.longDescription,
                    category: p.category,
                    stack: p.stack.join(", "),
                    tags: p.tags.join(", "),
                    githubUrl: p.githubUrl ?? "",
                    liveUrl: p.liveUrl ?? "",
                    status: p.status,
                    featured: p.featured,
                    displayOrder: p.displayOrder,
                });
            })
            .catch(() => setError("Failed to load project."))
            .finally(() => setLoading(false));
    }, [projectId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = {
            title: form.title,
            slug: form.slug,
            description: form.description,
            longDescription: form.longDescription,
            category: form.category,
            stack: form.stack
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            tags: form.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            githubUrl: form.githubUrl || undefined,
            liveUrl: form.liveUrl || undefined,
            status: form.status,
            featured: form.featured,
            displayOrder: form.displayOrder,
        };

        try {
            const url = projectId
                ? `/api/admin/projects/${projectId}`
                : "/api/admin/projects";
            const method = projectId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save project.");
                setSaving(false);
                return;
            }
            router.push("/admin/projects");
            router.refresh();
        } catch {
            setError("Network error.");
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!projectId) return;
        if (!confirm("Delete this project? This cannot be undone.")) return;
        await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
        router.push("/admin/projects");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    }

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <>
            <AdminPageHeader
                title={projectId ? "Edit Project" : "New Project"}
                description={
                    projectId
                        ? "Update an existing project."
                        : "Create a new project."
                }
                actions={
                    <button
                        onClick={() => router.push("/admin/projects")}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Basic Info
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                required
                                className={inputClass}
                                placeholder="My Awesome Project"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Slug</label>
                            <input
                                value={form.slug}
                                onChange={(e) =>
                                    setForm({ ...form, slug: e.target.value })
                                }
                                required
                                className={inputClass}
                                placeholder="my-awesome-project"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Description</label>
                            <input
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                required
                                className={inputClass}
                                placeholder="A short one-liner."
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>
                                Long Description
                            </label>
                            <textarea
                                value={form.longDescription}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        longDescription: e.target.value,
                                    })
                                }
                                required
                                rows={4}
                                className={inputClass}
                                placeholder="Detailed description of the project…"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Category</label>
                            <input
                                value={form.category}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        category: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    setForm({ ...form, status: e.target.value })
                                }
                                className={inputClass}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Links & Tags
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>GitHub URL</label>
                            <input
                                value={form.githubUrl}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        githubUrl: e.target.value,
                                    })
                                }
                                className={inputClass}
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Live URL</label>
                            <input
                                value={form.liveUrl}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        liveUrl: e.target.value,
                                    })
                                }
                                className={inputClass}
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Stack (comma-separated)
                            </label>
                            <input
                                value={form.stack}
                                onChange={(e) =>
                                    setForm({ ...form, stack: e.target.value })
                                }
                                className={inputClass}
                                placeholder="React, Node.js, Docker"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Tags (comma-separated)
                            </label>
                            <input
                                value={form.tags}
                                onChange={(e) =>
                                    setForm({ ...form, tags: e.target.value })
                                }
                                className={inputClass}
                                placeholder="devops, cloud, k8s"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Display Order</label>
                            <input
                                type="number"
                                value={form.displayOrder}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        displayOrder:
                                            parseInt(e.target.value) || 0,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            featured: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                                />
                                Featured project
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {projectId ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 rounded-lg border border-[var(--error)]/20 px-4 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/5"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving…" : "Save Project"}
                    </button>
                </div>
            </form>
        </>
    );
}
