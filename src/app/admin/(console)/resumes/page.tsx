"use client";

/**
 * Resume page — manage downloadable resume files.
 *
 * Lists all resume records (version, label, file, primary flag) in a table
 * and supports creating new ones via a modal (version + label + file URL +
 * primary toggle). Uses the existing /api/admin/resumes CRUD endpoints.
 */

import { useCallback, useState, type FormEvent } from "react";
import { Loader2, Plus, Star, Trash2, X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@/components/admin/AdminDataTable";
import type { Resume } from "@/lib/admin/types";

const columns: AdminColumn<Resume>[] = [
    {
        key: "version",
        label: "Version",
        sortable: true,
        render: (r) => (
            <span className="font-medium text-[var(--text-primary)]">
                {r.version}
            </span>
        ),
    },
    {
        key: "label",
        label: "Label",
        sortable: true,
        render: (r) => r.label,
    },
    {
        key: "fileUrl",
        label: "File",
        render: (r) => (
            <a
                href={r.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-[var(--accent-solid)] hover:underline"
            >
                {r.fileUrl}
            </a>
        ),
    },
    {
        key: "mimeType",
        label: "Type",
        render: (r) => (
            <span className="rounded-md bg-[var(--canvas-sunken)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]">
                {r.mimeType}
            </span>
        ),
    },
    {
        key: "isPrimary",
        label: "Primary",
        sortable: true,
        render: (r) =>
            r.isPrimary ? (
                <Star className="h-4 w-4 fill-[var(--warning)] text-[var(--warning)]" />
            ) : (
                <span className="text-[var(--text-quaternary)]">—</span>
            ),
    },
];

export default function AdminResumesPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [form, setForm] = useState({
        version: "",
        label: "Resume",
        fileUrl: "",
        isPrimary: false,
        notes: "",
    });

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/resumes", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    version: form.version,
                    label: form.label,
                    fileUrl: form.fileUrl,
                    isPrimary: form.isPrimary,
                    notes: form.notes,
                    fileSize: 0,
                    mimeType: "application/pdf",
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to create resume.");
                setSaving(false);
                return;
            }
            setShowCreate(false);
            setForm({
                version: "",
                label: "Resume",
                fileUrl: "",
                isPrimary: false,
                notes: "",
            });
            refresh();
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this resume?")) return;
        await fetch(`/api/admin/resumes/${id}`, { method: "DELETE" });
        refresh();
    };

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <>
            <AdminPageHeader
                title="Resume"
                description="Manage downloadable resume files and versions."
                actions={
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Resume
                    </button>
                }
            />

            <div key={refreshKey}>
                <AdminDataTable<Resume>
                    columns={[
                        ...columns,
                        {
                            key: "_actions",
                            label: "",
                            render: (r) => (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(r.id);
                                    }}
                                    className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            ),
                        },
                    ]}
                    fetchUrl="/api/admin/resumes"
                    rowKey={(r) => r.id}
                    emptyMessage="No resumes yet."
                />
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                Add Resume
                            </h2>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {error && (
                            <div className="mx-6 mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-2.5 text-sm text-[var(--error)]">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4 p-6">
                            <div>
                                <label className={labelClass}>Version</label>
                                <input
                                    value={form.version}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            version: e.target.value,
                                        })
                                    }
                                    placeholder="v1.0"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Label</label>
                                <input
                                    value={form.label}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            label: e.target.value,
                                        })
                                    }
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>File URL</label>
                                <input
                                    value={form.fileUrl}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            fileUrl: e.target.value,
                                        })
                                    }
                                    placeholder="/media/resume.pdf"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className={inputClass}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    checked={form.isPrimary}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            isPrimary: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-[var(--border-default)]"
                                />
                                Set as primary resume
                            </label>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
