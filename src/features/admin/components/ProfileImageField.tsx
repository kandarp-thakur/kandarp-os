"use client";

/**
 * ProfileImageField — the admin field for choosing and refining a profile
 * image (the hero portrait).
 *
 * Capabilities (per the Dynamic Profile Image spec):
 *  - **Choose / Replace** — opens the reusable `MediaPicker` (Media Library).
 *  - **Crop** — opens a crop modal; draws a selection rectangle on the image
 *    and sends normalized 0–1 fractions to the crop API, which crops the
 *    source in place and regenerates variants.
 *  - **Focal point** — opens a focal-point modal; click the image to set the
 *    subject anchor (normalized 0–1) that drives `object-position` on the
 *    public site.
 *  - **Preview** — shows the current image with its dimensions and variants.
 *  - **Remove / Restore placeholder** — clears the selection (sets
 *    `profileImageId` to null on save), so the hero falls back to the
 *    monogram placeholder.
 *
 * The field stores only the Media Library **id** (never a path). The parent
 * form persists `profileImageId`; the public site resolves it via
 * `resolveMediaAsset`. Deleting the underlying media asset nulls the
 * reference server-side, so the hero never breaks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
    Crop as CropIcon,
    Crosshair,
    Image as ImageIcon,
    Loader2,
    Trash2,
    X,
} from "lucide-react";

import { MediaPicker } from "@features/admin/components/MediaPicker";
import { Modal } from "@packages/ui/Modal";
import type { MediaAsset } from "@backend/schemas/types";

interface ProfileImageFieldProps {
    /** Currently-selected media asset, or null when no image is chosen. */
    value: MediaAsset | null;
    /** Called with the new asset (or null to clear / restore placeholder). */
    onChange: (asset: MediaAsset | null) => void;
    /** Field label. Defaults to "Profile Image". */
    label?: string;
    /** Help text below the field. */
    help?: string;
}

/** Best preview URL for an asset (smallest variant → legacy thumb → original). */
function previewSrc(asset: MediaAsset): string {
    const thumb = asset.variants?.find((v) => v.size === "thumbnail");
    if (thumb) return thumb.path;
    if (asset.thumbnail) return asset.thumbnail;
    return asset.path;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ProfileImageField({
    value,
    onChange,
    label = "Profile Image",
    help = "Choose an image from the Media Library. The hero portrait updates automatically.",
}: ProfileImageFieldProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [cropOpen, setCropOpen] = useState(false);
    const [focalOpen, setFocalOpen] = useState(false);

    const handleSelect = useCallback(
        (asset: MediaAsset) => {
            onChange(asset);
        },
        [onChange],
    );

    const handleRemove = useCallback(() => {
        onChange(null);
    }, [onChange]);

    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                {label}
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Preview */}
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--canvas-sunken)]">
                    {value && value.mimeType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={previewSrc(value)}
                            alt={value.alt || value.originalName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--text-quaternary)]">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-[0.65rem]">No image</span>
                        </div>
                    )}
                </div>

                {/* Actions + meta */}
                <div className="min-w-0 flex-1 space-y-3">
                    {value ? (
                        <>
                            <div className="text-sm">
                                <p className="truncate font-medium text-[var(--text-primary)]">
                                    {value.originalName}
                                </p>
                                <p className="text-xs text-[var(--text-tertiary)]">
                                    {formatSize(value.size)} · {value.mimeType}
                                    {value.width && value.height
                                        ? ` · ${value.width}×${value.height}`
                                        : ""}
                                    {value.focalPoint
                                        ? ` · focal ${Math.round(value.focalPoint.x * 100)}%,${Math.round(value.focalPoint.y * 100)}%`
                                        : ""}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(true)}
                                    className="rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    Replace
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCropOpen(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    <CropIcon className="h-3.5 w-3.5" />
                                    Crop
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFocalOpen(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--overlay-hover)]"
                                >
                                    <Crosshair className="h-3.5 w-3.5" />
                                    Focal Point
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--error)] transition-colors hover:bg-[var(--error-subtle,rgba(239,68,68,0.1))]"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-[var(--text-secondary)]">
                                No profile image selected. The hero shows a
                                placeholder monogram.
                            </p>
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Choose Image
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {help ? (
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                    {help}
                </p>
            ) : null}

            {/* Reusable Media Library picker */}
            <MediaPicker
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelect}
                selectedId={value?.id ?? null}
                title="Choose Profile Image"
                description="Select an existing image or upload a new one for the hero portrait."
            />

            {/* Crop modal */}
            {value ? (
                <CropModal
                    isOpen={cropOpen}
                    onClose={() => setCropOpen(false)}
                    asset={value}
                    onApplied={(updated) => onChange(updated)}
                />
            ) : null}

            {/* Focal-point modal */}
            {value ? (
                <FocalPointModal
                    isOpen={focalOpen}
                    onClose={() => setFocalOpen(false)}
                    asset={value}
                    onApplied={(updated) => onChange(updated)}
                />
            ) : null}
        </div>
    );
}

ProfileImageField.displayName = "ProfileImageField";

/* ── Crop modal ─────────────────────────────────────────────────────────── */

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: MediaAsset;
    onApplied: (updated: MediaAsset) => void;
}

interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Crop modal — draw a selection rectangle on the image, then send normalized
 * 0–1 fractions to the crop API. The API crops the source in place and
 * regenerates variants.
 */
function CropModal({ isOpen, onClose, asset, onApplied }: CropModalProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
    const [rect, setRect] = useState<CropRect | null>(null);
    const [dragStart, setDragStart] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state whenever the modal opens.
    useEffect(() => {
        if (isOpen) {
            setRect(null);
            setDragStart(null);
            setError(null);
            setNaturalSize({ w: 0, h: 0 });
        }
    }, [isOpen]);

    const handleImageLoad = useCallback(() => {
        const img = imgRef.current;
        if (img) {
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        }
    }, []);

    const getRelativePos = useCallback((clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const bounds = container.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width)),
            y: Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height)),
        };
    }, []);

    const handlePointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            const pos = getRelativePos(e.clientX, e.clientY);
            setDragStart(pos);
            setRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        },
        [getRelativePos],
    );

    const handlePointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (!dragStart) return;
            e.preventDefault();
            const pos = getRelativePos(e.clientX, e.clientY);
            const x = Math.min(dragStart.x, pos.x);
            const y = Math.min(dragStart.y, pos.y);
            const width = Math.abs(pos.x - dragStart.x);
            const height = Math.abs(pos.y - dragStart.y);
            setRect({ x, y, width, height });
        },
        [dragStart, getRelativePos],
    );

    const handlePointerUp = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            setDragStart(null);
            // Discard tiny selections (accidental clicks).
            if (rect && (rect.width < 0.05 || rect.height < 0.05)) {
                setRect(null);
            }
        },
        [rect],
    );

    const handleApply = useCallback(async () => {
        if (!rect || rect.width < 0.05 || rect.height < 0.05) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/media/${asset.id}/crop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                }),
            });
            if (!res.ok) {
                const msg = await res
                    .json()
                    .then((d) => d.error ?? "Crop failed")
                    .catch(() => "Crop failed");
                throw new Error(msg);
            }
            const updated: MediaAsset = await res.json();
            onApplied(updated);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Crop failed");
        } finally {
            setSaving(false);
        }
    }, [rect, asset.id, onApplied, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crop Image"
            description="Drag on the image to select the crop region. The source is cropped in place and variants are regenerated."
            size="lg"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {error ? (
                            <p className="truncate text-xs text-[var(--error)]">
                                {error}
                            </p>
                        ) : rect && rect.width >= 0.05 ? (
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Selection: {Math.round(rect.width * 100)}% ×{" "}
                                {Math.round(rect.height * 100)}% at{" "}
                                {Math.round(rect.x * 100)}%,{" "}
                                {Math.round(rect.y * 100)}%
                            </p>
                        ) : (
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Drag on the image to select a region.
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRect(null)}
                            disabled={!rect}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)] disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={
                                saving ||
                                !rect ||
                                rect.width < 0.05 ||
                                rect.height < 0.05
                            }
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CropIcon className="h-4 w-4" />
                            )}
                            {saving ? "Cropping…" : "Apply Crop"}
                        </button>
                    </div>
                </div>
            }
        >
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative mx-auto max-h-[60vh] cursor-crosshair select-none overflow-hidden rounded-xl bg-[var(--canvas-sunken)]"
                style={{
                    aspectRatio:
                        naturalSize.w && naturalSize.h
                            ? `${naturalSize.w} / ${naturalSize.h}`
                            : "1 / 1",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={imgRef}
                    src={asset.path}
                    alt={asset.alt || asset.originalName}
                    onLoad={handleImageLoad}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain"
                />
                {/* Darkened overlay outside the selection */}
                {rect && rect.width >= 0.05 && rect.height >= 0.05 ? (
                    <>
                        <div
                            className="pointer-events-none absolute inset-0 bg-black/60"
                            style={{
                                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.x * 100}% ${rect.y * 100}%, ${rect.x * 100}% ${(rect.y + rect.height) * 100}%, ${(rect.x + rect.width) * 100}% ${(rect.y + rect.height) * 100}%, ${(rect.x + rect.width) * 100}% ${rect.y * 100}%, ${rect.x * 100}% ${rect.y * 100}%)`,
                            }}
                        />
                        <div
                            className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0)] ring-1 ring-[var(--border-accent)]"
                            style={{
                                left: `${rect.x * 100}%`,
                                top: `${rect.y * 100}%`,
                                width: `${rect.width * 100}%`,
                                height: `${rect.height * 100}%`,
                            }}
                        />
                    </>
                ) : null}
            </div>
        </Modal>
    );
}

/* ── Focal-point modal ──────────────────────────────────────────────────── */

interface FocalPointModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: MediaAsset;
    onApplied: (updated: MediaAsset) => void;
}

/**
 * Focal-point modal — click the image to set the subject anchor (normalized
 * 0–1). Drives `object-position` on the public site so cover-fit keeps the
 * subject in frame.
 */
function FocalPointModal({
    isOpen,
    onClose,
    asset,
    onApplied,
}: FocalPointModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [point, setPoint] = useState<{ x: number; y: number } | null>(
        asset.focalPoint ?? null,
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPoint(asset.focalPoint ?? null);
            setError(null);
        }
    }, [isOpen, asset.focalPoint]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;
        const bounds = container.getBoundingClientRect();
        const x = Math.max(
            0,
            Math.min(1, (e.clientX - bounds.left) / bounds.width),
        );
        const y = Math.max(
            0,
            Math.min(1, (e.clientY - bounds.top) / bounds.height),
        );
        setPoint({ x, y });
    }, []);

    const handleApply = useCallback(async () => {
        if (!point) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/admin/media/${asset.id}/focal-point`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ focalPoint: point }),
                },
            );
            if (!res.ok) {
                const msg = await res
                    .json()
                    .then((d) => d.error ?? "Failed to set focal point")
                    .catch(() => "Failed to set focal point");
                throw new Error(msg);
            }
            const updated: MediaAsset = await res.json();
            onApplied(updated);
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to set focal point",
            );
        } finally {
            setSaving(false);
        }
    }, [point, asset.id, onApplied, onClose]);

    const handleClear = useCallback(async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/admin/media/${asset.id}/focal-point`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ focalPoint: null }),
                },
            );
            if (!res.ok) {
                const msg = await res
                    .json()
                    .then((d) => d.error ?? "Failed to clear focal point")
                    .catch(() => "Failed to clear focal point");
                throw new Error(msg);
            }
            const updated: MediaAsset = await res.json();
            onApplied(updated);
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to clear focal point",
            );
        } finally {
            setSaving(false);
        }
    }, [asset.id, onApplied, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Set Focal Point"
            description="Click the image to mark the subject anchor. This keeps the subject in frame when the image is cover-fit on the public site."
            size="lg"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {error ? (
                            <p className="truncate text-xs text-[var(--error)]">
                                {error}
                            </p>
                        ) : point ? (
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Focal point: {Math.round(point.x * 100)}%,{" "}
                                {Math.round(point.y * 100)}%
                            </p>
                        ) : (
                            <p className="text-xs text-[var(--text-tertiary)]">
                                No focal point set (defaults to center).
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={saving || !asset.focalPoint}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay-hover)] disabled:opacity-50"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={saving || !point}
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Crosshair className="h-4 w-4" />
                            )}
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            }
        >
            <div
                ref={containerRef}
                onClick={handleClick}
                className="relative mx-auto max-h-[60vh] cursor-crosshair select-none overflow-hidden rounded-xl bg-[var(--canvas-sunken)]"
                style={{
                    aspectRatio:
                        asset.width && asset.height
                            ? `${asset.width} / ${asset.height}`
                            : "1 / 1",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={asset.path}
                    alt={asset.alt || asset.originalName}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain"
                />
                {point ? (
                    <div
                        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${point.x * 100}%`,
                            top: `${point.y * 100}%`,
                        }}
                    >
                        <span className="absolute inset-0 rounded-full border-2 border-[var(--accent-solid)] bg-[var(--accent-solid)]/30" />
                        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-solid)]" />
                        <span className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-solid)]/50" />
                        <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-solid)]/50" />
                    </div>
                ) : null}
            </div>
        </Modal>
    );
}
