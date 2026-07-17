"use client";

/**
 * Asset Manager page — a folder-organized, filterable view of media assets.
 *
 * Complements the Media Library grid view with a file-manager style
 * layout: a folder sidebar, a filterable list/table of assets, and
 * detail in a side drawer. Uses the existing /api/admin/media endpoints.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    File,
    FileImage,
    Folder,
    Loader2,
    Search,
    Tag,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { MediaAsset } from "@/lib/admin/types";

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
    return mime.startsWith("image/");
}

export default function AdminAssetManagerPage() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState<string>("/");
    const [search, setSearch] = useState("");
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [selected, setSelected] = useState<MediaAsset | null>(null);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/media?pageSize=500");
            if (!res.ok) {
                setError("Failed to load assets.");
                return;
            }
            const data = await res.json();
            setAssets(data.rows ?? []);
        } catch {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAssets();
    }, [fetchAssets]);

    // Derive the folder tree from asset paths.
    const folders = useMemo(() => {
        const set = new Set<string>(["/"]);
        for (const a of assets) {
            const folder = a.folder || "/";
            set.add(folder);
        }
        return Array.from(set).sort();
    }, [assets]);

    // Derive the tag cloud.
    const tags = useMemo(() => {
        const set = new Set<string>();
        for (const a of assets) for (const t of a.tags ?? []) set.add(t);
        return Array.from(set).sort();
    }, [assets]);

    // Apply filters.
    const filtered = useMemo(() => {
        return assets.filter((a) => {
            if ((a.folder || "/") !== activeFolder) return false;
            if (activeTag && !(a.tags ?? []).includes(activeTag)) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !a.name.toLowerCase().includes(q) &&
                    !a.alt?.toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });
    }, [assets, activeFolder, activeTag, search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this asset?")) return;
        await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
        setAssets((prev) => prev.filter((a) => a.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const folderCount = (folder: string) =>
        assets.filter((a) => (a.folder || "/") === folder).length;

    return (
        <>
            <AdminPageHeader
                title="Asset Manager"
                description="Browse, filter, and organize media assets by folder and tag."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                {/* ── Folder sidebar ──────────────────────────────────────── */}
                <div className="admin-glass h-fit rounded-xl p-3">
                    <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                        Folders
                    </p>
                    <ul className="space-y-0.5">
                        {folders.map((folder) => (
                            <li key={folder}>
                                <button
                                    onClick={() => setActiveFolder(folder)}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                                        activeFolder === folder
                                            ? "bg-[var(--accent-subtle)] text-[var(--accent-solid)]"
                                            : "text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                    }`}
                                >
                                    <Folder className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {folder === "/" ? "Root" : folder}
                                    </span>
                                    <span className="ml-auto text-xs text-[var(--text-quaternary)]">
                                        {folderCount(folder)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {tags.length > 0 && (
                        <>
                            <p className="mb-2 mt-4 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                Tags
                            </p>
                            <div className="flex flex-wrap gap-1.5 px-1">
                                {tags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() =>
                                            setActiveTag((t) =>
                                                t === tag ? null : tag,
                                            )
                                        }
                                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                            activeTag === tag
                                                ? "bg-[var(--accent-solid)] text-white"
                                                : "bg-[var(--canvas-sunken)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                        }`}
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Asset list ─────────────────────────────────────────── */}
                <div className="admin-glass overflow-hidden rounded-xl">
                    <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-quaternary)]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search assets…"
                                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                            />
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)]">
                            {filtered.length} of {assets.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <File className="mb-2 h-8 w-8 text-[var(--text-quaternary)]" />
                            <p className="text-sm text-[var(--text-tertiary)]">
                                No assets in this folder.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] text-left text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                    <th className="px-4 py-2.5 font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Size
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Usage
                                    </th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {filtered.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        onClick={() => setSelected(asset)}
                                        className="cursor-pointer transition-colors hover:bg-[var(--overlay-hover)]"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                {isImage(asset.mimeType) ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            asset.thumbnail ||
                                                            asset.path
                                                        }
                                                        alt={asset.alt}
                                                        className="h-8 w-8 shrink-0 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--canvas-sunken)]">
                                                        <File className="h-4 w-4 text-[var(--text-tertiary)]" />
                                                    </div>
                                                )}
                                                <span className="truncate font-medium text-[var(--text-primary)]">
                                                    {asset.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--text-tertiary)]">
                                            {isImage(asset.mimeType) ? (
                                                <span className="flex items-center gap-1.5">
                                                    <FileImage className="h-3.5 w-3.5" />
                                                    Image
                                                </span>
                                            ) : (
                                                asset.mimeType
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--text-tertiary)]">
                                            {formatSize(asset.size)}
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--text-tertiary)]">
                                            {asset.usageCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(asset.id);
                                                }}
                                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── Detail drawer ─────────────────────────────────────────── */}
            {selected && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    />
                    <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="truncate text-base font-semibold text-[var(--text-primary)]">
                                {selected.name}
                            </h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {isImage(selected.mimeType) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={selected.path}
                                    alt={selected.alt}
                                    className="w-full rounded-lg border border-[var(--border-subtle)] object-contain"
                                />
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Path
                                    </span>
                                    <span className="truncate font-mono text-xs text-[var(--text-secondary)]">
                                        {selected.path}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Type
                                    </span>
                                    <span className="text-[var(--text-secondary)]">
                                        {selected.mimeType}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Size
                                    </span>
                                    <span className="text-[var(--text-secondary)]">
                                        {formatSize(selected.size)}
                                    </span>
                                </div>
                                {selected.width && selected.height && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-tertiary)]">
                                            Dimensions
                                        </span>
                                        <span className="text-[var(--text-secondary)]">
                                            {selected.width} × {selected.height}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Folder
                                    </span>
                                    <span className="text-[var(--text-secondary)]">
                                        {selected.folder || "/"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Optimized
                                    </span>
                                    <span className="text-[var(--text-secondary)]">
                                        {selected.optimized ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-tertiary)]">
                                        Usage
                                    </span>
                                    <span className="text-[var(--text-secondary)]">
                                        {selected.usageCount} references
                                    </span>
                                </div>
                                {selected.alt && (
                                    <div>
                                        <span className="text-[var(--text-tertiary)]">
                                            Alt text
                                        </span>
                                        <p className="mt-1 text-[var(--text-secondary)]">
                                            {selected.alt}
                                        </p>
                                    </div>
                                )}
                                {selected.tags.length > 0 && (
                                    <div>
                                        <span className="text-[var(--text-tertiary)]">
                                            Tags
                                        </span>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {selected.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    className="flex items-center gap-1 rounded-md bg-[var(--canvas-sunken)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-[var(--border-subtle)] p-4">
                            <button
                                onClick={() => handleDelete(selected.id)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--error)]/20 px-4 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/5"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Asset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
