"use client";

/**
 * Blog editor — create/edit a blog post with MDX content.
 *
 * Supports title, slug, excerpt, category, tags, status, featured flag,
 * and the MDX body. The content textarea is a plain editor (no rich-text
 * WYSIWYG) — MDX is written directly, matching the existing blog pipeline.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { BlogPost } from "@backend/schemas/types";

interface BlogEditorProps {
    postId?: string;
}

interface FormState {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string;
    status: string;
    featured: boolean;
    readingTime: number;
}

const emptyForm: FormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "General",
    tags: "",
    status: "draft",
    featured: false,
    readingTime: 0,
};

export function BlogEditor({ postId }: BlogEditorProps) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [loading, setLoading] = useState(!!postId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!postId) return;
        fetch(`/api/admin/blog/${postId}`)
            .then((r) => r.json())
            .then((p: BlogPost) => {
                setForm({
                    title: p.title,
                    slug: p.slug,
                    excerpt: p.excerpt,
                    content: p.content,
                    category: p.category,
                    tags: p.tags.join(", "),
                    status: p.status,
                    featured: p.featured,
                    readingTime: p.readingTime,
                });
            })
            .catch(() => setError("Failed to load post."))
            .finally(() => setLoading(false));
    }, [postId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = {
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            content: form.content,
            category: form.category,
            tags: form.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            status: form.status,
            featured: form.featured,
            readingTime: form.readingTime,
        };

        try {
            const url = postId
                ? `/api/admin/blog/${postId}`
                : "/api/admin/blog";
            const method = postId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save post.");
                setSaving(false);
                return;
            }
            router.push("/admin/blog");
            router.refresh();
        } catch {
            setError("Network error.");
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!postId) return;
        if (!confirm("Delete this post? This cannot be undone.")) return;
        await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
        router.push("/admin/blog");
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
                title={postId ? "Edit Post" : "New Post"}
                description={
                    postId
                        ? "Update an existing blog post."
                        : "Create a new blog post."
                }
                actions={
                    <button
                        onClick={() => router.push("/admin/blog")}
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
                        Post Info
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
                                placeholder="My Blog Post"
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
                                placeholder="my-blog-post"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Excerpt</label>
                            <input
                                value={form.excerpt}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        excerpt: e.target.value,
                                    })
                                }
                                required
                                className={inputClass}
                                placeholder="A short summary of the post."
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
                                placeholder="devops, k8s, docker"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Reading Time (min)
                            </label>
                            <input
                                type="number"
                                value={form.readingTime}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        readingTime:
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
                                Featured post
                            </label>
                        </div>
                    </div>
                </div>

                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                        Content (MDX)
                    </h2>
                    <textarea
                        value={form.content}
                        onChange={(e) =>
                            setForm({ ...form, content: e.target.value })
                        }
                        rows={20}
                        className={`${inputClass} font-mono text-xs`}
                        placeholder={
                            "# My Post\n\nWrite your MDX content here…"
                        }
                    />
                </div>

                <div className="flex items-center justify-between">
                    {postId ? (
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
                        {saving ? "Saving…" : "Save Post"}
                    </button>
                </div>
            </form>
        </>
    );
}
