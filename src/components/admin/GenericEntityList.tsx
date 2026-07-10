"use client";

/**
 * GenericEntityList — a reusable list page for simple entities that don't
 * need a custom editor (Experience, Skills, Awards, etc.).
 *
 * Renders the AdminDataTable with inline create/delete via a modal form.
 * The parent provides the columns, fetch URL, and a simple field config
 * for the create form.
 *
 * Enhanced features (all opt-in via props):
 *  - Row selection + bulk actions (archive, restore, delete, duplicate)
 *  - Drag-and-drop reordering
 *  - Per-row archive/restore/duplicate actions
 *  - Import / Export buttons
 *  - Edit modal (inline PATCH)
 */

import { useRef, useState, type FormEvent } from "react";
import {
    Archive,
    ArchiveRestore,
    Copy,
    Download,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    AdminDataTable,
    standardBulkActions,
    type AdminColumn,
    type BulkAction,
} from "@/components/admin/AdminDataTable";

export interface CreateField {
    key: string;
    label: string;
    type?: "text" | "number" | "textarea" | "select";
    options?: string[];
    required?: boolean;
    placeholder?: string;
}

interface GenericEntityListProps<T> {
    title: string;
    description: string;
    fetchUrl: string;
    columns: AdminColumn<T>[];
    rowKey: (row: T) => string;
    createFields: CreateField[];
    /** The entity label for audit logs, e.g. "skill". */
    entityLabel: string;
    /** Enable row selection + bulk action bar. Default: true. */
    enableBulk?: boolean;
    /** Custom bulk actions. Defaults to standardBulkActions. */
    bulkActions?: BulkAction[];
    /** Enable drag-and-drop reordering. Default: false. */
    enableReorder?: boolean;
    /** Enable per-row archive/restore toggle. Default: true. */
    enableArchive?: boolean;
    /** Enable per-row duplicate. Default: true. */
    enableDuplicate?: boolean;
    /** Enable inline edit modal. Default: true. */
    enableEdit?: boolean;
    /** Enable import/export buttons. Default: true. */
    enableImportExport?: boolean;
    /** Fields shown in the edit modal. Defaults to createFields. */
    editFields?: CreateField[];
}

export function GenericEntityList<
    T extends { id: string; archivedAt?: string | null },
>({
    title,
    description,
    fetchUrl,
    columns,
    rowKey,
    createFields,
    entityLabel,
    enableBulk = true,
    bulkActions = standardBulkActions,
    enableReorder = false,
    enableArchive = true,
    enableDuplicate = true,
    enableEdit = true,
    enableImportExport = true,
    editFields,
}: GenericEntityListProps<T>) {
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [formData, setFormData] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fieldsForEdit = editFields ?? createFields;

    const triggerRefresh = () => setRefreshKey((k) => k + 1);

    /* ── Create ──────────────────────────────────────────────────────────── */

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload: Record<string, unknown> = {};
        for (const field of createFields) {
            const val = formData[field.key] ?? "";
            if (field.required && !val) {
                setError(`${field.label} is required.`);
                setSaving(false);
                return;
            }
            payload[field.key] =
                field.type === "number" ? parseInt(val) || 0 : val;
        }

        try {
            const res = await fetch(fetchUrl, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? `Failed to create ${entityLabel}.`);
                setSaving(false);
                return;
            }
            setShowCreate(false);
            setFormData({});
            triggerRefresh();
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    /* ── Edit ────────────────────────────────────────────────────────────── */

    const openEdit = async (id: string) => {
        setEditingId(id);
        setError(null);
        try {
            const res = await fetch(`${fetchUrl}/${id}`);
            if (res.ok) {
                const entity = await res.json();
                const data: Record<string, string> = {};
                for (const field of fieldsForEdit) {
                    const val = entity[field.key];
                    data[field.key] =
                        val !== undefined && val !== null ? String(val) : "";
                }
                setFormData(data);
                setShowEdit(true);
            }
        } catch {
            setError("Failed to load entity.");
        }
    };

    const handleEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setSaving(true);
        setError(null);

        const payload: Record<string, unknown> = {};
        for (const field of fieldsForEdit) {
            const val = formData[field.key] ?? "";
            if (field.required && !val) {
                setError(`${field.label} is required.`);
                setSaving(false);
                return;
            }
            payload[field.key] =
                field.type === "number" ? parseInt(val) || 0 : val;
        }

        try {
            const res = await fetch(`${fetchUrl}/${editingId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? `Failed to update ${entityLabel}.`);
                setSaving(false);
                return;
            }
            setShowEdit(false);
            setFormData({});
            setEditingId(null);
            triggerRefresh();
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ──────────────────────────────────────────────────────────── */

    const handleDelete = async (id: string) => {
        if (!confirm(`Delete this ${entityLabel}? This cannot be undone.`))
            return;
        await fetch(`${fetchUrl}/${id}`, { method: "DELETE" });
        triggerRefresh();
    };

    /* ── Archive / Restore ───────────────────────────────────────────────── */

    const handleArchive = async (id: string) => {
        await fetch(`${fetchUrl}/${id}/archive`, { method: "POST" });
        triggerRefresh();
    };

    const handleRestore = async (id: string) => {
        await fetch(`${fetchUrl}/${id}/restore`, { method: "POST" });
        triggerRefresh();
    };

    /* ── Duplicate ───────────────────────────────────────────────────────── */

    const handleDuplicate = async (id: string) => {
        await fetch(`${fetchUrl}/${id}/duplicate`, { method: "POST" });
        triggerRefresh();
    };

    /* ── Bulk actions ────────────────────────────────────────────────────── */

    const handleBulkAction = async (action: string, ids: string[]) => {
        await fetch(`${fetchUrl}/bulk`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids, action }),
        });
    };

    /* ── Import / Export ──────────────────────────────────────────────────── */

    const handleExport = async () => {
        try {
            const res = await fetch(`${fetchUrl}/export`);
            if (!res.ok) return;
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${entityLabel}-export.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // Silent fail
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const rows = parsed.rows ?? parsed;
            await fetch(`${fetchUrl}/import`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ rows, mode: "merge" }),
            });
            triggerRefresh();
        } catch {
            setError("Failed to import file. Make sure it's valid JSON.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    /* ── Build action column ─────────────────────────────────────────────── */

    const actionColumn: AdminColumn<T> = {
        key: "_actions",
        label: "",
        className: "w-1 text-right",
        render: (row) => {
            const id = rowKey(row);
            const isArchived = !!row.archivedAt;
            return (
                <div className="flex items-center justify-end gap-0.5">
                    {enableEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openEdit(id);
                            }}
                            title="Edit"
                            className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] hover:text-[var(--text-secondary)]"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {enableDuplicate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(id);
                            }}
                            title="Duplicate"
                            className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] hover:text-[var(--text-secondary)]"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {enableArchive &&
                        (isArchived ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(id);
                                }}
                                title="Restore"
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--success)]/5 hover:text-[var(--success)]"
                            >
                                <ArchiveRestore className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(id);
                                }}
                                title="Archive"
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] hover:text-[var(--text-secondary)]"
                            >
                                <Archive className="h-3.5 w-3.5" />
                            </button>
                        ))}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(id);
                        }}
                        title="Delete"
                        className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            );
        },
    };

    /* ── Styles ───────────────────────────────────────────────────────────── */

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

    /* ── Render field (shared by create + edit modals) ────────────────────── */

    const renderField = (field: CreateField) => (
        <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            {field.type === "textarea" ? (
                <textarea
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                        })
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={3}
                    className={inputClass}
                />
            ) : field.type === "select" ? (
                <select
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                        })
                    }
                    required={field.required}
                    className={inputClass}
                >
                    <option value="">Select…</option>
                    {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={field.type === "number" ? "number" : "text"}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                        })
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                    className={inputClass}
                />
            )}
        </div>
    );

    return (
        <>
            <AdminPageHeader
                title={title}
                description={description}
                actions={
                    <div className="flex items-center gap-2">
                        {enableImportExport && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                                <button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                setShowCreate(true);
                                setError(null);
                                setFormData({});
                            }}
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" />
                            Add {entityLabel}
                        </button>
                    </div>
                }
            />

            <div key={refreshKey}>
                <AdminDataTable<T>
                    columns={[...columns, actionColumn]}
                    fetchUrl={fetchUrl}
                    rowKey={rowKey}
                    emptyMessage={`No ${entityLabel}s yet. Click Add ${entityLabel} to create one.`}
                    selectable={enableBulk}
                    bulkActions={bulkActions}
                    onBulkAction={handleBulkAction}
                    reorderable={enableReorder}
                    reorderUrl={
                        enableReorder ? `${fetchUrl}/reorder` : undefined
                    }
                    onReorder={triggerRefresh}
                />
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                Add {entityLabel}
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
                            {createFields.map(renderField)}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {saving
                                        ? "Creating…"
                                        : `Create ${entityLabel}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {showEdit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setShowEdit(false)}
                    />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                Edit {entityLabel}
                            </h2>
                            <button
                                onClick={() => setShowEdit(false)}
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

                        <form onSubmit={handleEdit} className="space-y-4 p-6">
                            {fieldsForEdit.map(renderField)}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEdit(false)}
                                    className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
