/**
 * Image optimization pipeline — server-only, sharp-backed.
 *
 * Generates a responsive variant set for every uploaded image asset:
 *   • thumbnail  (≤ 320px wide)  — grid/list previews, mobile thumbnails
 *   • medium     (≤ 768px wide)  — tablet + most card images
 *   • large      (≤ 1280px wide) — desktop / hero / full-bleed
 *
 * Each variant is emitted in the original format (kept) AND in WebP + AVIF so
 * the browser can negotiate the best codec through a `<picture>` source set.
 * A tiny inline blur placeholder (base64 data URI) is also produced for the
 * progressive-loading fade-in on the public site.
 *
 * This module is the single, reusable optimization seam. Every CMS entity
 * that stores a Media id (profile image, blog cover, project thumbnail, …)
 * resolves to the same variant set — no per-feature upload logic.
 *
 * Non-image assets pass through untouched (the caller decides whether to
 * call this at all).
 *
 * @module lib/admin/image-optimization
 */

import {
    existsSync,
    mkdirSync,
    renameSync,
    unlinkSync,
    writeFileSync,
} from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

import sharp from "sharp";

import type { MediaAsset, MediaVariant } from "@/lib/admin/types";

/** The public-root-relative media directory (served statically by Next). */
const MEDIA_PUBLIC_DIR = join("public", "media");
/** The absolute media directory on disk. */
const mediaAbsDir = () => join(process.cwd(), MEDIA_PUBLIC_DIR);

/** Supported input MIME types that the pipeline will process. */
export const OPTIMIZABLE_MIME = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
]);

/** Variant width buckets (px). Heights are derived to preserve aspect ratio. */
const VARIANT_WIDTHS: Record<MediaVariant["size"], number> = {
    thumbnail: 320,
    medium: 768,
    large: 1280,
};

/** Ordered variant sizes (smallest → largest) for srcset assembly. */
export const VARIANT_SIZES: MediaVariant["size"][] = [
    "thumbnail",
    "medium",
    "large",
];

/** Quality presets per output codec (0–100). Tuned for visual parity. */
const QUALITY = {
    jpeg: 78,
    webp: 80,
    avif: 65,
    png: 90, // PNG is lossless-ish; keep quality high.
} as const;

/** Blur-placeholder target width (px). Tiny on purpose — it's inline. */
const BLUR_WIDTH = 20;

/**
 * Is this MIME type something the pipeline can optimize?
 * Non-image assets (PDFs, docs) return false and are left untouched.
 */
export function isOptimizable(mimeType: string): boolean {
    return OPTIMIZABLE_MIME.has(mimeType);
}

/** Resolve the absolute path for a public-root-relative media path. */
export function absPathFor(publicPath: string): string {
    // `publicPath` looks like "/media/<file>"; strip the leading slash.
    return join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

/** Resolve the public-root-relative path for an absolute media file. */
function publicPathFor(absPath: string): string {
    return `/${absPath.slice(join(process.cwd(), "public").length + 1).replace(/\\/g, "/")}`;
}

/** Ensure the media directory exists. */
function ensureMediaDir(): void {
    if (!existsSync(mediaAbsDir()))
        mkdirSync(mediaAbsDir(), { recursive: true });
}

/** The output format key kept alongside the original (for the `path` field). */
function keptFormat(
    mimeType: string,
): "jpeg" | "png" | "webp" | "avif" | "gif" {
    if (mimeType === "image/jpeg") return "jpeg";
    if (mimeType === "image/png") return "png";
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/avif") return "avif";
    return "gif";
}

/** Write a buffer to disk atomically (temp + rename) and return its public path. */
function writeVariant(baseName: string, ext: string, buf: Buffer): string {
    ensureMediaDir();
    const filename = `${baseName}.${ext}`;
    const abs = join(mediaAbsDir(), filename);
    const tmp = `${abs}.tmp`;
    writeFileSync(tmp, buf);
    renameSync(tmp, abs);
    return publicPathFor(abs);
}

/**
 * Generate a single responsive variant (original-format + webp + avif).
 * Skips variants wider than the source image (no upscaling).
 */
async function generateVariant(
    pipeline: sharp.Sharp,
    sourceWidth: number,
    size: MediaVariant["size"],
    baseName: string,
    kept: "jpeg" | "png" | "webp" | "avif" | "gif",
): Promise<MediaVariant | null> {
    const targetWidth = VARIANT_WIDTHS[size];
    // Never upscale — if the source is smaller than the bucket, skip it.
    if (sourceWidth < targetWidth && size !== "thumbnail") return null;

    const width = Math.min(targetWidth, sourceWidth);

    // Original-format output.
    const keptBuf = await pipeline
        .clone()
        .resize({ width, withoutEnlargement: true })
        .toFormat(kept, {
            quality: kept === "png" ? QUALITY.png : QUALITY.jpeg,
            mozjpeg: kept === "jpeg",
        })
        .toBuffer();

    const keptPath = writeVariant(baseName, kept, keptBuf);

    // WebP output (always — best compression for photos).
    const webpBuf = await pipeline
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY.webp })
        .toBuffer();
    const webpPath = writeVariant(baseName, "webp", webpBuf);

    // AVIF output (always — best compression for photos, modern browsers).
    const avifBuf = await pipeline
        .clone()
        .resize({ width, withoutEnlargement: true })
        .avif({ quality: QUALITY.avif })
        .toBuffer();
    const avifPath = writeVariant(baseName, "avif", avifBuf);

    // Read back the rendered dimensions for this width.
    const meta = await sharp(keptBuf).metadata();

    return {
        size,
        width: meta.width ?? width,
        height: meta.height ?? 0,
        path: keptPath,
        webp: webpPath,
        avif: avifPath,
        bytes: keptBuf.length,
    };
}

/**
 * Generate the tiny inline blur placeholder — a heavily downscaled, blurred
 * JPEG encoded as a base64 data URI. The public site inlines this in the
 * `<img>`/`<picture>` so the frame is never empty while the real image loads.
 */
async function generateBlurPlaceholder(pipeline: sharp.Sharp): Promise<string> {
    try {
        const buf = await pipeline
            .clone()
            .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
            // Mild blur so edges soften; the upscaling on the client adds the rest.
            .blur(1.2)
            .jpeg({ quality: 60, mozjpeg: true })
            .toBuffer();
        return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
        return "";
    }
}

/**
 * Run the full optimization pipeline on an image asset's source file.
 *
 * Reads the source from disk (the upload route has already written it),
 * generates all variants + the blur placeholder, and returns the fields to
 * merge back into the MediaAsset record. The caller persists the result.
 *
 * Returns `null` for non-image assets (caller should skip).
 */
export async function optimizeImageAsset(
    asset: Pick<MediaAsset, "path" | "mimeType" | "name">,
): Promise<{
    width: number;
    height: number;
    variants: MediaVariant[];
    blurDataUrl: string;
    optimized: true;
} | null> {
    if (!isOptimizable(asset.mimeType)) return null;

    const srcAbs = absPathFor(asset.path);
    if (!existsSync(srcAbs)) return null;

    const pipeline = sharp(srcAbs, { failOn: "none" });
    const meta = await pipeline.metadata();
    const sourceWidth = meta.width ?? 0;
    const sourceHeight = meta.height ?? 0;
    if (!sourceWidth || !sourceHeight) return null;

    const kept = keptFormat(asset.mimeType);
    // Base name for variant files: the original uuid stem (strip extension).
    const baseStem = asset.name.replace(/\.[^.]+$/, "") || randomUUID();

    const variants: MediaVariant[] = [];
    for (const size of VARIANT_SIZES) {
        const variantBase = `${baseStem}-${size}`;
        const v = await generateVariant(
            pipeline,
            sourceWidth,
            size,
            variantBase,
            kept,
        );
        if (v) variants.push(v);
    }

    const blurDataUrl = await generateBlurPlaceholder(pipeline);

    return {
        width: sourceWidth,
        height: sourceHeight,
        variants,
        blurDataUrl,
        optimized: true,
    };
}

/**
 * Delete every generated variant file for an asset (the original + all
 * derived files). Called when a media asset is deleted so the disk doesn't
 * accumulate orphaned files. Best-effort — missing files are ignored.
 */
export function deleteAssetFiles(asset: MediaAsset): void {
    const files = [asset.path];
    for (const v of asset.variants ?? []) {
        files.push(v.path);
        if (v.webp) files.push(v.webp);
        if (v.avif) files.push(v.avif);
    }
    for (const f of files) {
        const abs = absPathFor(f);
        try {
            if (existsSync(abs)) unlinkSync(abs);
        } catch {
            // Ignore — best-effort cleanup.
        }
    }
}

/**
 * Delete only the generated variant files for an asset (keep the original).
 * Called before a re-optimization so stale variants don't linger.
 */
export function deleteVariantFiles(asset: MediaAsset): void {
    for (const v of asset.variants ?? []) {
        for (const f of [v.path, v.webp, v.avif]) {
            if (!f) continue;
            const abs = absPathFor(f);
            try {
                if (existsSync(abs)) unlinkSync(abs);
            } catch {
                // Ignore — best-effort cleanup.
            }
        }
    }
}

/**
 * Apply a crop to the source image and rewrite the original file in place.
 *
 * The crop is specified as normalized 0–1 fractions of the source dimensions
 * (x, y, width, height). After cropping, the caller should re-run
 * `optimizeImageAsset` to regenerate variants from the new source.
 *
 * Returns the new pixel dimensions of the cropped source.
 */
export async function cropSourceImage(
    asset: Pick<MediaAsset, "path" | "mimeType">,
    crop: { x: number; y: number; width: number; height: number },
): Promise<{ width: number; height: number }> {
    const srcAbs = absPathFor(asset.path);
    const pipeline = sharp(srcAbs, { failOn: "none" });
    const meta = await pipeline.metadata();
    const sourceWidth = meta.width ?? 0;
    const sourceHeight = meta.height ?? 0;
    if (!sourceWidth || !sourceHeight) {
        throw new Error("Cannot read source image dimensions");
    }

    const left = Math.round(crop.x * sourceWidth);
    const top = Math.round(crop.y * sourceHeight);
    const w = Math.round(crop.width * sourceWidth);
    const h = Math.round(crop.height * sourceHeight);

    const buf = await pipeline
        .extract({
            left: Math.min(left, sourceWidth - 1),
            top: Math.min(top, sourceHeight - 1),
            width: Math.max(1, Math.min(w, sourceWidth - left)),
            height: Math.max(1, Math.min(h, sourceHeight - top)),
        })
        .toBuffer();

    // Overwrite the original source file with the cropped result.
    const tmp = `${srcAbs}.tmp`;
    writeFileSync(tmp, buf);
    renameSync(tmp, srcAbs);

    const newMeta = await sharp(buf).metadata();
    return {
        width: newMeta.width ?? w,
        height: newMeta.height ?? h,
    };
}
