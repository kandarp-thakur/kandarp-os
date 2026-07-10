"use client";

/**
 * Media Library page — grid view of uploaded media assets with upload.
 *
 * Supports drag-and-drop file upload (via the media upload API) and
 * displays assets in a responsive grid with name, size, and type.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { MediaAsset } from "@/lib/admin/types";

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/media?pageSize=100");
            if (res.ok) {
                const data = await res.json();
                setAssets(data.rows ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount (client-only — `fetch` with a relative URL is invalid
    // during SSR, so this must run in an effect, not a `useState` initializer).
    useEffect(() => {
        void fetchAssets();
    }, [fetchAssets]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                await fetch("/api/admin/media/upload", {
                    method: "POST",
                    body: formData,
                });
            }
            await fetchAssets();
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this asset?")) return;
        await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
        setAssets((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <>
            <AdminPageHeader
                title="Media Library"
                description="Upload and manage images and files."
                actions={
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {uploading ? "Uploading…" : "Upload"}
                    </button>
                }
            />

            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : assets.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] py-20 text-center"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mb-3 h-8 w-8 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        Drop files here or click to upload
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Images, documents — up to 10 MB each
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {assets.map((asset) => (
                        <div
                            key={asset.id}
                            className="admin-glass group overflow-hidden rounded-xl"
                        >
                            <div className="relative flex aspect-square items-center justify-center bg-[var(--canvas-sunken)]">
                                {asset.mimeType.startsWith("image/") ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={asset.path}
                                        alt={asset.alt || asset.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-[var(--text-quaternary)]" />
                                )}
                                <button
                                    onClick={() => handleDelete(asset.id)}
                                    className="absolute right-2 top-2 rounded-md bg-[var(--canvas-elevated)]/80 p-1.5 text-[var(--error)] opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                    {asset.originalName}
                                </p>
                                <p className="text-xs text-[var(--text-tertiary)]">
                                    {formatSize(asset.size)} · {asset.mimeType}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
