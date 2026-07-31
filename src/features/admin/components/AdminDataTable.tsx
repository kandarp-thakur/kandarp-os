"use client";

/**
 * AdminDataTable — a reusable, client-side data table for admin list pages.
 *
 * Features: column sorting, debounced search, pagination, row actions,
 * row selection + bulk action bar, and drag-and-drop reordering.
 * The parent provides the columns config + a fetch function; this component
 * handles the rest. Designed to be generic over any entity type.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
    Archive,
    ArchiveRestore,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Copy,
    Loader2,
    Search,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { cn } from "@utils/cn";

export interface AdminColumn<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render: (row: T) => ReactNode;
    /** Sort accessor — defaults to the key. */
    sortValue?: (row: T) => string | number;
    className?: string;
}

export interface BulkAction {
    key: string;
    label: string;
    icon?: ReactNode;
    variant?: "default" | "danger";
    /** Confirm dialog message, if any. */
    confirm?: string;
}

interface AdminDataTableProps<T> {
    columns: AdminColumn<T>[];
    fetchUrl: string;
    rowKey: (row: T) => string;
    rowHref?: (row: T) => string;
    emptyMessage?: string;
    pageSize?: number;
    /** Enable row selection with checkboxes. */
    selectable?: boolean;
    /** Bulk actions shown when rows are selected. */
    bulkActions?: BulkAction[];
    /** Called when a bulk action is triggered with the selected ids. */
    onBulkAction?: (action: string, ids: string[]) => Promise<void> | void;
    /** Enable drag-and-drop reordering. */
    reorderable?: boolean;
    /** URL to POST the reordered ids to. */
    reorderUrl?: string;
    /** Called after a successful reorder (to refresh data). */
    onReorder?: () => void;
}

export function AdminDataTable<T>({
    columns,
    fetchUrl,
    rowKey,
    rowHref,
    emptyMessage = "No items found.",
    pageSize = 20,
    selectable = false,
    bulkActions = [],
    onBulkAction,
    reorderable = false,
    reorderUrl,
    onReorder,
}: AdminDataTableProps<T>) {
    const [rows, setRows] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<string | undefined>(undefined);
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [loading, setLoading] = useState(true);

    // Selection state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkBusy, setBulkBusy] = useState(false);

    // Drag-and-drop state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [reordering, setReordering] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
        });
        if (search) params.set("search", search);
        if (sort) {
            params.set("sort", sort);
            params.set("order", order);
        }
        try {
            const res = await fetch(`${fetchUrl}?${params}`);
            if (res.ok) {
                const data = await res.json();
                setRows(data.rows ?? []);
                setTotal(data.total ?? 0);
                setTotalPages(data.totalPages ?? 1);
            }
        } catch {
            // Silent fail.
        } finally {
            setLoading(false);
        }
    }, [fetchUrl, page, pageSize, search, sort, order]);

    useEffect(() => {
        const timer = setTimeout(fetchData, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [fetchData, search]);

    const toggleSort = (key: string) => {
        if (sort === key) {
            setOrder((o) => (o === "asc" ? "desc" : "asc"));
        } else {
            setSort(key);
            setOrder("asc");
        }
    };

    /* ── Selection ──────────────────────────────────────────────────────── */

    const allSelected =
        rows.length > 0 && rows.every((r) => selected.has(rowKey(r)));
    const someSelected =
        rows.some((r) => selected.has(rowKey(r))) && !allSelected;

    const toggleAll = () => {
        if (allSelected) {
            setSelected((prev) => {
                const next = new Set(prev);
                for (const r of rows) next.delete(rowKey(r));
                return next;
            });
        } else {
            setSelected((prev) => {
                const next = new Set(prev);
                for (const r of rows) next.add(rowKey(r));
                return next;
            });
        }
    };

    const toggleRow = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const handleBulkAction = async (action: BulkAction) => {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        if (
            action.confirm &&
            !confirm(action.confirm.replace("{count}", String(ids.length)))
        )
            return;
        setBulkBusy(true);
        try {
            await onBulkAction?.(action.key, ids);
            clearSelection();
            await fetchData();
        } finally {
            setBulkBusy(false);
        }
    };

    /* ── Drag-and-drop reorder ───────────────────────────────────────────── */

    const handleDragStart = (idx: number) => {
        if (!reorderable) return;
        setDragIndex(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        if (!reorderable || dragIndex === null) return;
        e.preventDefault();
        setDragOverIndex(idx);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault();
        if (!reorderable || dragIndex === null || dragIndex === dropIdx) {
            handleDragEnd();
            return;
        }
        const reordered = [...rows];
        const [moved] = reordered.splice(dragIndex, 1);
        if (moved !== undefined) reordered.splice(dropIdx, 0, moved);
        setRows(reordered);
        setDragIndex(null);
        setDragOverIndex(null);

        if (reorderUrl) {
            setReordering(true);
            try {
                await fetch(reorderUrl, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ ids: reordered.map(rowKey) }),
                });
                onReorder?.();
            } catch {
                // Revert on failure
                await fetchData();
            } finally {
                setReordering(false);
            }
        }
    };

    /* ── Default bulk actions (if parent doesn't provide custom ones) ────── */

    const defaultBulkActions: BulkAction[] =
        bulkActions.length > 0 ? bulkActions : [];

    const colSpan =
        columns.length + (selectable ? 1 : 0) + (reorderable ? 1 : 0);

    return (
        <div className="admin-glass overflow-hidden rounded-xl">
            {/* Search bar */}
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
                <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
                <input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search…"
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)]"
                />
                {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                )}
                {reordering && (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                )}
            </div>

            {/* Bulk action bar */}
            {selectable && selected.size > 0 && (
                <div className="flex items-center gap-3 border-b border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-2.5">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        {selected.size} selected
                    </span>
                    <div className="flex items-center gap-1.5">
                        {defaultBulkActions.map((action) => (
                            <button
                                key={action.key}
                                disabled={bulkBusy}
                                onClick={() => handleBulkAction(action)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                                    action.variant === "danger"
                                        ? "text-[var(--error)] hover:bg-[var(--error)]/10"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]",
                                )}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={clearSelection}
                        disabled={bulkBusy}
                        className="ml-auto rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="admin-scroll overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/50">
                            {selectable && (
                                <th className="w-10 px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el)
                                                el.indeterminate = someSelected;
                                        }}
                                        onChange={toggleAll}
                                        className="h-4 w-4 cursor-pointer rounded border-[var(--border-default)] accent-[var(--accent)]"
                                    />
                                </th>
                            )}
                            {reorderable && <th className="w-10 px-4 py-2.5" />}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]",
                                        col.sortable &&
                                            "cursor-pointer select-none hover:text-[var(--text-secondary)]",
                                        col.className,
                                    )}
                                    onClick={
                                        col.sortable
                                            ? () => toggleSort(col.key)
                                            : undefined
                                    }
                                >
                                    <span className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable &&
                                            sort === col.key &&
                                            (order === "asc" ? (
                                                <ChevronUp className="h-3 w-3" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3" />
                                            ))}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && !loading ? (
                            <tr>
                                <td
                                    colSpan={colSpan}
                                    className="px-4 py-10 text-center text-sm text-[var(--text-tertiary)]"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => {
                                const id = rowKey(row);
                                const isSelected = selected.has(id);
                                const isDragOver =
                                    dragOverIndex === idx && dragIndex !== null;
                                const isDragging = dragIndex === idx;
                                return (
                                    <tr
                                        key={id}
                                        draggable={reorderable}
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) =>
                                            handleDragOver(e, idx)
                                        }
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        className={cn(
                                            "border-b border-[var(--border-subtle)] transition-colors last:border-0",
                                            rowHref &&
                                                "cursor-pointer hover:bg-[var(--overlay-hover)]",
                                            isSelected &&
                                                "bg-[var(--accent)]/5",
                                            isDragging && "opacity-40",
                                            isDragOver &&
                                                "border-t-2 border-t-[var(--accent)]",
                                        )}
                                        onClick={
                                            rowHref && !reorderable
                                                ? () => {
                                                      window.location.href =
                                                          rowHref(row);
                                                  }
                                                : undefined
                                        }
                                    >
                                        {selectable && (
                                            <td
                                                className="px-4 py-3"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        toggleRow(id)
                                                    }
                                                    className="h-4 w-4 cursor-pointer rounded border-[var(--border-default)] accent-[var(--accent)]"
                                                />
                                            </td>
                                        )}
                                        {reorderable && (
                                            <td
                                                className="px-4 py-3"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <span className="block cursor-grab text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] active:cursor-grabbing">
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 16 16"
                                                        fill="currentColor"
                                                    >
                                                        <circle
                                                            cx="5"
                                                            cy="3"
                                                            r="1.2"
                                                        />
                                                        <circle
                                                            cx="5"
                                                            cy="8"
                                                            r="1.2"
                                                        />
                                                        <circle
                                                            cx="5"
                                                            cy="13"
                                                            r="1.2"
                                                        />
                                                        <circle
                                                            cx="11"
                                                            cy="3"
                                                            r="1.2"
                                                        />
                                                        <circle
                                                            cx="11"
                                                            cy="8"
                                                            r="1.2"
                                                        />
                                                        <circle
                                                            cx="11"
                                                            cy="13"
                                                            r="1.2"
                                                        />
                                                    </svg>
                                                </span>
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={cn(
                                                    "px-4 py-3 text-sm text-[var(--text-secondary)]",
                                                    col.className,
                                                )}
                                            >
                                                {col.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3">
                    <p className="text-xs text-[var(--text-tertiary)]">
                        {total} item{total !== 1 ? "s" : ""} · Page {page} of{" "}
                        {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                            className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)] disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Preset bulk action sets ─────────────────────────────────────────────── */

/** Standard bulk actions for content entities (archive, restore, delete, duplicate). */
export const standardBulkActions: BulkAction[] = [
    {
        key: "archive",
        label: "Archive",
        icon: <Archive className="h-3.5 w-3.5" />,
        confirm: "Archive {count} selected item(s)?",
    },
    {
        key: "restore",
        label: "Restore",
        icon: <ArchiveRestore className="h-3.5 w-3.5" />,
    },
    {
        key: "duplicate",
        label: "Duplicate",
        icon: <Copy className="h-3.5 w-3.5" />,
    },
    {
        key: "delete",
        label: "Delete",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        variant: "danger",
        confirm: "Delete {count} selected item(s)? This cannot be undone.",
    },
];

/** Bulk actions for publishable entities (adds publish/draft). */
export const publishableBulkActions: BulkAction[] = [
    {
        key: "publish",
        label: "Publish",
        icon: <UploadCloud className="h-3.5 w-3.5" />,
    },
    {
        key: "draft",
        label: "Set Draft",
    },
    ...standardBulkActions,
];
