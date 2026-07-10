"use client";

/**
 * MediaPicker — a reusable modal-based Media Library picker.
 *
 * Lets an admin select an existing media asset or upload a new one, then
 * returns the chosen `MediaAsset` to the parent. This is the single reusable
 * contract every CMS entity (profile image, blog cover, project thumbnail,
 * logo, award, …) uses to attach a Media Library image — no duplicate upload
 * logic anywhere (component-rules §"Future Ready").
 *
 * Features:
 *  - Select an existing asset from a searchable grid.
 *  - Upload a new asset (click or drag-and-drop) without leaving the picker.
 *  - Filter to a MIME prefix (defaults to images only).
 *  - Preview the hovered/selected asset before confirming.
 *  - Keyboard accessible (the underlying Modal provides focus trap + Escape).
 *
 * The parent receives the full `MediaAsset` (id + preview metadata) and is
 * expected to persist only the `id` (e.g. `profileImageId`). The public site
 * resolves that id to a render descriptor via `resolveMediaAsset`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
    Check,
    Image as ImageIcon,
    Loader2,
    Search,
    Upload,
    X,
} from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/utils/cn";
import type { MediaAsset } from "@/lib/admin/types";

interface MediaPickerProps {
    /** Whether the picker dialog is open. */
    isOpen: boolean;
    /** Called when the dialog requests to close (Escape / scrim / cancel). */
    onClose: () => void;
    /** Called with the chosen asset when the user confirms a selection. */
    onSelect: (asset: MediaAsset) => void;
    /** Currently-selected asset id (highlights the active card). */
    selectedId?: string | null;
    /** Restrict the grid to assets whose MIME starts with this prefix. Defaults to `"image/"`. */
    mimePrefix?: string;
    /** Dialog title. Defaults to "Select Media". */
    title?: string;
    /** Dialog description. */
    description?: string;
}

interface PagedMedia {
    rows: MediaAsset[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Resolve the best preview URL for an asset: prefer the smallest generated
 * variant (thumbnail), then the legacy `thumbnail` field, then the original.
 */
function previewSrc(asset: MediaAsset): string {
    const thumb = asset.variants?.find((v) => v.size === "thumbnail");
    if (thumb) return thumb.path;
    if (asset.thumbnail) return asset.thumbnail;
    return asset.path;
}

export function MediaPicker({
    isOpen,
    onClose,
    onSelect,
    selectedId,
    mimePrefix = "image/",
    title = "Select Media",
    description = "Choose an existing image or upload a new one.",
}: MediaPickerProps) {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pickedId, setPickedId] = useState<string | null>(selectedId ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset the local pick state whenever the dialog (re)opens.
    useEffect(() => {
        if (isOpen) {
            setPickedId(selectedId ?? null);
            setSearch("");
            setDebouncedSearch("");
        }
    }, [isOpen, selectedId]);

    // Debounce the search term (300ms) to avoid hammering the API on each keystroke.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search]);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageSize: "100",
                sort: "createdAt",
                order: "desc",
            });
            if (debouncedSearch) params.set("search", debouncedSearch);
            const res = await fetch(`/api/admin/media?${params.toString()}`);
            if (res.ok) {
                const data: PagedMedia = await res.json();
                // Client-side MIME-prefix filter (repo only does exact-match filters).
                const filtered = mimePrefix
                    ? (data.rows ?? []).filter((a) =>
                          a.mimeType.startsWith(mimePrefix),
                      )
                    : (data.rows ?? []);
                setAssets(filtered);
            } else {
                setAssets([]);
            }
        } catch {
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, mimePrefix]);

    // Fetch whenever the dialog opens or the debounced search changes.
    useEffect(() => {
        if (isOpen) void fetchAssets();
    }, [isOpen, fetchAssets]);

    const handleUpload = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;
            setUploading(true);
            try {
                const uploaded: MediaAsset[] = [];
                for (const file of Array.from(files)) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch("/api/admin/media/upload", {
                        method: "POST",
                        body: formData,
                    });
                    if (res.ok) {
                        const asset: MediaAsset = await res.json();
                        uploaded.push(asset);
                    }
                }
                if (uploaded.length > 0) {
                    // Auto-select the first uploaded asset and refresh the grid.
                    const first = uploaded[0];
                    if (first) setPickedId(first.id);
                    await fetchAssets();
                }
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [fetchAssets],
    );

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            void handleUpload(e.dataTransfer.files);
        },
        [handleUpload],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Only clear when leaving the container itself, not a child element.
        if (e.currentTarget === e.target) setIsDragging(false);
    }, []);

    const pickedAsset = assets.find((a) => a.id === pickedId) ?? null;

    const handleConfirm = useCallback(() => {
        if (pickedAsset) {
            onSelect(pickedAsset);
            onClose();
        }
    }, [pickedAsset, onSelect, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-[var(--text-tertiary)]">
                        {pickedAsset
                            ? `Selected: ${pickedAsset.originalName}`
                            : "No image selected"}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!pickedAsset}
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            Select
                        </button>
                    </div>
                </div>
            }
        >
            {/* Toolbar: search + upload */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search media…"
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-sunken)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--overlay-hover)] disabled:opacity-60"
                >
                    {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    {uploading ? "Uploading…" : "Upload"}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={mimePrefix ? `${mimePrefix}*` : undefined}
                    className="hidden"
                    onChange={(e) => {
                        void handleUpload(e.target.files);
                    }}
                />
            </div>

            {/* Grid (drag-and-drop target) */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative min-h-[18rem] rounded-xl border-2 border-dashed transition-colors",
                    isDragging
                        ? "border-[var(--border-accent)] bg-[var(--accent-subtle)]"
                        : "border-[var(--border-default)]",
                )}
            >
                {loading ? (
                    <div className="flex h-72 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                    </div>
                ) : assets.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-72 w-full flex-col items-center justify-center gap-2 text-center"
                    >
                        <Upload className="h-8 w-8 text-[var(--text-quaternary)]" />
                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                            {search
                                ? "No matches. Drop a file here to upload."
                                : "Drop files here or click to upload"}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Images up to 10 MB each
                        </p>
                    </button>
                ) : (
                    <div className="grid grid-cols-3 gap-3 p-3 sm:grid-cols-4 md:grid-cols-5">
                        {assets.map((asset) => {
                            const isPicked = asset.id === pickedId;
                            return (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setPickedId(asset.id)}
                                    title={asset.originalName}
                                    className={cn(
                                        "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                                        isPicked
                                            ? "border-[var(--border-accent)] ring-2 ring-[var(--border-accent)] ring-offset-2 ring-offset-[var(--canvas)]"
                                            : "border-transparent hover:border-[var(--border-default)]",
                                    )}
                                >
                                    {asset.mimeType.startsWith("image/") ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={previewSrc(asset)}
                                            alt={
                                                asset.alt || asset.originalName
                                            }
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[var(--canvas-sunken)]">
                                            <ImageIcon className="h-8 w-8 text-[var(--text-quaternary)]" />
                                        </div>
                                    )}
                                    {isPicked ? (
                                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-solid)] text-white shadow-sm">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    ) : null}
                                    <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-[0.65rem] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        {asset.originalName} ·{" "}
                                        {formatSize(asset.size)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview strip for the picked asset */}
            {pickedAsset ? (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--canvas-elevated)]">
                        {pickedAsset.mimeType.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewSrc(pickedAsset)}
                                alt={
                                    pickedAsset.alt || pickedAsset.originalName
                                }
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-[var(--text-quaternary)]" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {pickedAsset.originalName}
                        </p>
                        <p className="truncate text-xs text-[var(--text-tertiary)]">
                            {formatSize(pickedAsset.size)} ·{" "}
                            {pickedAsset.mimeType}
                            {pickedAsset.width && pickedAsset.height
                                ? ` · ${pickedAsset.width}×${pickedAsset.height}`
                                : ""}
                        </p>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}

MediaPicker.displayName = "MediaPicker";
