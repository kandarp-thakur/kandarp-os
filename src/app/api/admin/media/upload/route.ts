/**
 * POST /api/admin/media/upload — upload a file to the media library (media:write).
 *
 * Accepts multipart/form-data with a single `file` field. The file is
 * written to `public/media/<uuid>.<ext>` and a media-asset record is
 * created in the store. For images, the optimization pipeline then
 * generates responsive variants (thumbnail/medium/large) in the original
 * format + WebP + AVIF, plus an inline blur placeholder, and records the
 * source dimensions. Returns the created asset.
 *
 * Enforced constraints:
 *   • Max size 10 MB.
 *   • Images: JPG, PNG, WebP, AVIF (and GIF) only.
 *
 * The asset's `path` is relative to the public root so the public site can
 * reference it as `/media/<uuid>.<ext>`.
 */

import { randomUUID } from "crypto";

import {
    audit,
    error,
    json,
    requirePermission,
} from "@backend/middlewares/api";
import { create, findById, update } from "@backend/repositories/repo";
import { revalidateCollection } from "@backend/cache/revalidate";
import { storage } from "@backend/storage/storage";
import {
    optimizeImageAsset,
    isOptimizable,
} from "@backend/services/image-optimization";
import type { MediaAsset } from "@backend/schemas/types";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/** Allowed image MIME types for upload (per the task spec). */
const ALLOWED_IMAGE_MIME = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
]);

/**
 * Map a validated MIME type to a safe, lowercase file extension. The
 * extension is derived from the MIME type — never from the user-supplied
 * filename — so a malicious name like `../../evil.js` or `shell.exe` cannot
 * control the on-disk filename or bypass the type check.
 */
const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    // Common non-image document types (allowed for documents).
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/json": "json",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
};

/** A safe fallback extension for unknown MIME types. */
const DEFAULT_EXT = "bin";

export async function POST(req: Request) {
    const session = await requirePermission("media:write");
    if (session instanceof Response) return session;

    const formData = await req.formData().catch(() => null);
    if (!formData) return error("Expected multipart/form-data", 400);

    const file = formData.get("file");
    if (!(file instanceof File)) return error("No file provided", 400);
    if (file.size > MAX_SIZE) return error("File too large (max 10 MB)", 413);

    // Validate image MIME type (non-image files are allowed for documents).
    if (file.type.startsWith("image/") && !ALLOWED_IMAGE_MIME.has(file.type)) {
        return error(
            "Unsupported image format. Allowed: JPG, PNG, WebP, AVIF.",
            415,
            415,
        );
    }

    // Generate a unique filename. The extension is derived from the validated
    // MIME type (never the user-supplied name) to prevent path traversal and
    // executable upload bypasses (e.g. `../../evil.js`, `shell.exe`).
    const ext = MIME_TO_EXT[file.type] ?? DEFAULT_EXT;
    const filename = `${randomUUID()}.${ext}`;

    // Upload via the storage provider (local disk or Cloudinary). The provider
    // returns the public URL to store in the asset's `path` field.
    const bytes = Buffer.from(await file.arrayBuffer());
    const { url: publicUrl } = await storage.upload(filename, bytes, file.type);

    // Create the asset record first (so it has an id + name for variant files).
    const asset = await create<MediaAsset>(
        "media",
        {
            name: filename,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            path: publicUrl,
            alt: "",
            folder: "/",
            tags: [],
            metadata: {},
            usageCount: 0,
            optimized: false,
            variants: [],
            blurDataUrl: "",
            focalPoint: null,
            archivedAt: null,
        },
        session.sub,
    );

    // Run the optimization pipeline for images (non-blocking-failure: if it
    // errors, the original is still usable; we just mark optimized=false).
    if (isOptimizable(asset.mimeType)) {
        try {
            const result = await optimizeImageAsset({
                path: asset.path,
                mimeType: asset.mimeType,
                name: asset.name,
            });
            if (result) {
                const updated = await update<MediaAsset>(
                    "media",
                    asset.id,
                    {
                        width: result.width,
                        height: result.height,
                        variants: result.variants,
                        blurDataUrl: result.blurDataUrl,
                        optimized: true,
                    },
                    session.sub,
                );
                if (updated) {
                    audit(
                        session,
                        "media.upload",
                        "media",
                        updated.id,
                        file.name,
                    );
                    revalidateCollection("media");
                    return json(updated, 201);
                }
            }
        } catch {
            // Optimization failed — return the un-optimized asset so the
            // upload still succeeds; the admin can re-optimize later.
        }
    }

    // Re-read the created asset (the create() return may be stale if update
    // was attempted but returned null).
    const fresh = (await findById<MediaAsset>("media", asset.id)) ?? asset;
    audit(session, "media.upload", "media", fresh.id, file.name);
    revalidateCollection("media");
    return json(fresh, 201);
}
