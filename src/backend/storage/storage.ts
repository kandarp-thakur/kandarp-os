/**
 * Storage abstraction — a provider interface for media file storage.
 *
 * The admin media library stores uploaded files and their optimized variants.
 * This module abstracts *where* those bytes live so the app can run:
 *   • **Local** — files in `public/media/` (dev, self-hosted, no CDN).
 *   • **Cloudinary** — files in a Cloudinary cloud (production, CDN-backed,
 *     on-the-fly transforms).
 *
 * The provider is selected once at module load based on env config: if
 * `CLOUDINARY_CLOUD_NAME` is set, Cloudinary is used; otherwise local. This
 * means the same code runs in dev (local disk) and prod (Cloudinary) with
 * zero route-handler changes — the routes call `storage.upload()` and don't
 * care where the bytes land.
 *
 * The interface is intentionally minimal:
 *   • `upload(key, buffer, mimeType)` — store bytes, return a public URL.
 *   • `read(key)` — fetch bytes (for sharp to process).
 *   • `delete(key)` — remove a file.
 *   • `deleteMany(keys)` — bulk remove (best-effort).
 *   • `publicUrl(key)` — resolve a key to a public URL.
 *
 * Keys are opaque strings (e.g. `<uuid>.webp`). The provider maps them to
 * storage locations (local path or Cloudinary public id). The `MediaAsset.path`
 * field stores the public URL returned by `upload()` so the public site can
 * reference it directly.
 *
 * Server-only: uses `fs` (local) and the Cloudinary SDK (cloud), both Node-only.
 *
 * @see docs/backend/media.md — storage providers, Cloudinary setup.
 */

import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    unlinkSync,
    renameSync,
} from "fs";
import { join } from "path";

// `cloudinary` is a CommonJS module; with esModuleInterop the named `v2`
// export imports cleanly as an ESM default-binding. The module is safe to
// import unconditionally — it only performs network I/O when its methods
// are called, so importing it in a local-only environment has no side
// effects. The provider is only *constructed* when Cloudinary env vars are
// present (see `selectProvider`), so `cloudinaryV2.config()` is never called
// with missing credentials.
import { v2 as cloudinaryV2 } from "cloudinary";

import { env } from "@backend/config/env-schema";
import { logger } from "@backend/logging/logger";

/** A stored file's key (opaque, provider-specific). */
export type StorageKey = string;

/** Result of an upload — the public URL and the storage key. */
export interface UploadResult {
    /** The public URL the browser uses to fetch the file. */
    url: string;
    /** The opaque storage key (for later read/delete). */
    key: StorageKey;
}

/** The storage provider interface. */
export interface StorageProvider {
    /** Store bytes under a key. Returns the public URL + key. */
    upload(
        key: StorageKey,
        buffer: Buffer,
        mimeType: string,
    ): Promise<UploadResult>;
    /** Read bytes for a key (for server-side processing, e.g. sharp). */
    read(key: StorageKey): Promise<Buffer>;
    /** Delete a file by key. Best-effort (missing files are ignored). */
    delete(key: StorageKey): Promise<void>;
    /** Delete multiple files. Best-effort. */
    deleteMany(keys: StorageKey[]): Promise<void>;
    /** Resolve a key to its public URL (without uploading). */
    publicUrl(key: StorageKey): string;
    /** Whether this provider is remote (CDN) or local (disk). */
    readonly isRemote: boolean;
}

// ── Local storage provider ─────────────────────────────────────────────────

/** The public-root-relative media directory (served statically by Next). */
const LOCAL_MEDIA_DIR = "public/media";

/** Resolve the absolute path for a local media key. */
function localAbsPath(key: StorageKey): string {
    return join(process.cwd(), LOCAL_MEDIA_DIR, key);
}

/** Ensure the local media directory exists. */
function ensureLocalDir(): void {
    const dir = join(process.cwd(), LOCAL_MEDIA_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Local storage provider — writes files to `public/media/`.
 *
 * The public URL is `/<key>` (e.g. `/media/<uuid>.webp`), served statically
 * by Next.js. This is the default in development and for self-hosted deploys
 * without a CDN.
 */
class LocalStorageProvider implements StorageProvider {
    readonly isRemote = false;

    async upload(
        key: StorageKey,
        buffer: Buffer,
        _mimeType: string,
    ): Promise<UploadResult> {
        ensureLocalDir();
        const abs = localAbsPath(key);
        // Atomic write: temp file + rename so a crash mid-write doesn't leave
        // a partial file that looks valid.
        const tmp = `${abs}.tmp`;
        writeFileSync(tmp, buffer);
        renameSync(tmp, abs);
        return { url: this.publicUrl(key), key };
    }

    async read(key: StorageKey): Promise<Buffer> {
        const abs = localAbsPath(key);
        return readFileSync(abs);
    }

    async delete(key: StorageKey): Promise<void> {
        const abs = localAbsPath(key);
        try {
            if (existsSync(abs)) unlinkSync(abs);
        } catch (err) {
            logger.warn({ err, key }, "storage.local.delete_failed");
        }
    }

    async deleteMany(keys: StorageKey[]): Promise<void> {
        await Promise.all(keys.map((k) => this.delete(k)));
    }

    publicUrl(key: StorageKey): string {
        // The key already includes the `media/` prefix (e.g. `media/<uuid>.webp`)
        // OR is just a filename. Normalize to `/media/<filename>`.
        const normalized = key.startsWith("media/") ? key.slice(6) : key;
        return `/media/${normalized}`;
    }
}

// ── Cloudinary storage provider ─────────────────────────────────────────────

/**
 * Cloudinary storage provider — uploads to a Cloudinary cloud.
 *
 * Cloudinary handles:
 *   • Storage — files live in the cloud (no local disk needed).
 *   • CDN delivery — public URLs are `https://res.cloudinary.com/<cloud>/...`.
 *   • On-the-fly transforms — variants are URL params, not separate files.
 *
 * The upload folder is configurable via `CLOUDINARY_UPLOAD_FOLDER` (default
 * `kandarp-os`). Each file is stored as `<folder>/<key>`.
 *
 * Note: the image-optimization pipeline (sharp) still runs server-side to
 * generate the blur placeholder and read dimensions. For Cloudinary, we
 * upload the original and let Cloudinary generate variants on-demand via
 * URL transformations — but the `MediaAsset.variants` array is still
 * populated with transform URLs so the public site's `<picture>` logic
 * works unchanged.
 */
class CloudinaryStorageProvider implements StorageProvider {
    readonly isRemote = true;

    private cloudName: string;
    private apiKey: string;
    private apiSecret: string;
    private folder: string;

    constructor() {
        // The provider is only constructed when all three Cloudinary env vars
        // are present (see `selectProvider`), so these are guaranteed non-null.
        // We assert via a runtime check to satisfy ESLint's no-non-null-assertion.
        const cloudName = env.CLOUDINARY_CLOUD_NAME;
        const apiKey = env.CLOUDINARY_API_KEY;
        const apiSecret = env.CLOUDINARY_API_SECRET;
        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error("Cloudinary env vars missing");
        }
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.folder = env.CLOUDINARY_UPLOAD_FOLDER;

        // Configure the imported `v2` singleton with our credentials. The
        // module is imported at the top of the file (no `require()`), but
        // configuration happens here so it only runs when Cloudinary is
        // actually selected as the provider.
        cloudinaryV2.config({
            cloud_name: this.cloudName,
            api_key: this.apiKey,
            api_secret: this.apiSecret,
            secure: true,
        });
        logger.info(
            { cloud: this.cloudName, folder: this.folder },
            "storage.cloudinary.configured",
        );
    }

    async upload(
        key: StorageKey,
        buffer: Buffer,
        mimeType: string,
    ): Promise<UploadResult> {
        const publicId = this.publicId(key);
        return new Promise<UploadResult>((resolve, reject) => {
            const uploadStream = cloudinaryV2.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: this.folder,
                    resource_type: mimeType.startsWith("image/")
                        ? "image"
                        : "raw",
                    overwrite: false,
                },
                (err: unknown, result: { secure_url?: string } | undefined) => {
                    if (err) {
                        logger.error(
                            { err, key },
                            "storage.cloudinary.upload_failed",
                        );
                        reject(err);
                        return;
                    }
                    if (!result?.secure_url) {
                        reject(new Error("Cloudinary upload returned no URL"));
                        return;
                    }
                    resolve({ url: result.secure_url, key });
                },
            );
            // Write the buffer to the upload stream.
            uploadStream.end(buffer);
        });
    }

    async read(key: StorageKey): Promise<Buffer> {
        // Fetch the original from Cloudinary. Used by sharp for optimization.
        const url = this.publicUrl(key);
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Cloudinary read failed: ${res.status} for ${key}`);
        }
        return Buffer.from(await res.arrayBuffer());
    }

    async delete(key: StorageKey): Promise<void> {
        const publicId = this.publicId(key);
        try {
            await cloudinaryV2.uploader.destroy(publicId, {
                resource_type: "image",
            });
        } catch (err) {
            // Best-effort — a missing file is not an error.
            logger.debug({ err, key }, "storage.cloudinary.delete_skipped");
        }
    }

    async deleteMany(keys: StorageKey[]): Promise<void> {
        if (keys.length === 0) return;
        const publicIds = keys.map((k) => this.publicId(k));
        try {
            await cloudinaryV2.api.delete_resources(publicIds, {
                resource_type: "image",
            });
        } catch (err) {
            logger.warn(
                { err, count: keys.length },
                "storage.cloudinary.delete_many_failed",
            );
        }
    }

    publicUrl(key: StorageKey): string {
        const publicId = this.publicId(key);
        return cloudinaryV2.url(publicId, {
            secure: true,
            resource_type: "image",
        });
    }

    /** Convert a storage key to a Cloudinary public id (strip extension, prefix folder). */
    private publicId(key: StorageKey): string {
        // Cloudinary public ids don't include the file extension for images
        // (it's derived from the resource type). For raw files, keep it.
        const normalized = key.startsWith("media/") ? key.slice(6) : key;
        return `${this.folder}/${normalized.replace(/\.[^.]+$/, "")}`;
    }
}

// ── Provider selection ──────────────────────────────────────────────────────

/**
 * Select the storage provider based on env config.
 *
 * If `CLOUDINARY_CLOUD_NAME` is set (and the API key/secret), use Cloudinary.
 * Otherwise, use local disk. This is evaluated once at module load.
 */
function selectProvider(): StorageProvider {
    if (
        env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
    ) {
        try {
            return new CloudinaryStorageProvider();
        } catch (err) {
            logger.error(
                { err },
                "storage.cloudinary.init_failed_fallback_local",
            );
        }
    }
    return new LocalStorageProvider();
}

/** The active storage provider. Import this everywhere. */
export const storage: StorageProvider = selectProvider();

/** True when using Cloudinary (remote CDN). */
export const isCloudinary = storage.isRemote;

/**
 * Generate a Cloudinary transform URL for a variant.
 *
 * For local storage, variants are separate files (generated by sharp). For
 * Cloudinary, variants are on-the-fly URL transforms — no separate upload.
 * This helper builds the transform URL so the public site can use the same
 * `<picture>` srcset logic regardless of provider.
 *
 * @param publicUrl The base public URL (from `storage.publicUrl()`).
 * @param width     The target width in pixels.
 * @param format    The output format ("webp", "avif", "auto").
 * @returns A transform URL (Cloudinary) or the original URL (local).
 */
export function variantUrl(
    publicUrl: string,
    width: number,
    format: "webp" | "avif" | "auto" = "auto",
): string {
    if (!isCloudinary) return publicUrl;
    // Cloudinary transform: insert `f_<format>,w_<width>` before the public id.
    // The URL looks like: https://res.cloudinary.com/<cloud>/image/upload/<id>.<ext>
    // We insert `/upload/f_<format>,w_<width>/` after `/upload/`.
    const uploadMarker = "/image/upload/";
    const idx = publicUrl.indexOf(uploadMarker);
    if (idx === -1) return publicUrl;
    const before = publicUrl.slice(0, idx + uploadMarker.length);
    const after = publicUrl.slice(idx + uploadMarker.length);
    const fmt = format === "auto" ? "auto" : format;
    return `${before}f_${fmt},w_${width}/${after}`;
}
