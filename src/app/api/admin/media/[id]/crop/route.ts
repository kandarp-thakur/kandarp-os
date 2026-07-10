/**
 * POST /api/admin/media/[id]/crop — crop an image asset's source (media:write).
 *
 * Accepts a JSON body `{ x, y, width, height }` with normalized 0–1 fractions
 * of the source dimensions. Crops the source file in place, then re-runs the
 * optimization pipeline to regenerate variants from the new source.
 *
 * Optionally accepts `focalPoint: { x, y }` (normalized 0–1) to set the
 * subject anchor for cover-fit `object-position` on the public site.
 *
 * Non-image assets return 400.
 */

import { z } from "zod";

import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@/lib/admin/api";
import { findById, update } from "@/lib/admin/repo";
import {
    cropSourceImage,
    deleteVariantFiles,
    isOptimizable,
    optimizeImageAsset,
} from "@/lib/admin/image-optimization";
import type { MediaAsset } from "@/lib/admin/types";

const cropBodySchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0.01).max(1),
    height: z.number().min(0.01).max(1),
    focalPoint: z
        .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
        })
        .optional(),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("media:write");
    if (session instanceof Response) return session;
    const { id } = await params;

    const asset = findById<MediaAsset>("media", id);
    if (!asset) return error("Media asset not found", 404, 404);
    if (!isOptimizable(asset.mimeType)) {
        return error("Asset is not an optimizable image", 400);
    }

    const body = await parseBody(req, cropBodySchema);
    if (body instanceof Response) return body;

    // Clear stale variants on disk before cropping (they'll be regenerated).
    deleteVariantFiles(asset);

    // Crop the source file in place.
    const dims = await cropSourceImage(asset, {
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
    }).catch((err) => {
        throw err;
    });

    // Re-run the optimization pipeline on the cropped source.
    const result = await optimizeImageAsset({
        path: asset.path,
        mimeType: asset.mimeType,
        name: asset.name,
    });

    const patch: Partial<MediaAsset> = {
        width: dims.width,
        height: dims.height,
        // Recompute the focal point relative to the cropped frame. The crop's
        // top-left becomes the new origin; scale the old focal point into it.
        focalPoint: body.focalPoint ?? asset.focalPoint,
    };
    if (result) {
        patch.variants = result.variants;
        patch.blurDataUrl = result.blurDataUrl;
        patch.optimized = true;
    }

    const updated = await update<MediaAsset>("media", id, patch, session.sub);
    if (!updated) return error("Media asset not found", 404, 404);

    audit(session, "media.crop", "media", id);
    return json(updated);
}
