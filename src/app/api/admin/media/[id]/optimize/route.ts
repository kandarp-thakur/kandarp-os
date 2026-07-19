/**
 * POST /api/admin/media/[id]/optimize — re-run the optimization pipeline on an
 * existing image asset (media:write).
 *
 * Clears stale generated variants, regenerates them from the current source
 * file, and refreshes the blur placeholder + dimensions. Used after a crop or
 * when an asset was uploaded before optimization existed.
 *
 * Non-image assets return 400.
 */

import {
    audit,
    error,
    json,
    requirePermission,
} from "@backend/middlewares/api";
import { findById, update } from "@backend/repositories/repo";
import {
    deleteVariantFiles,
    isOptimizable,
    optimizeImageAsset,
} from "@backend/services/image-optimization";
import type { MediaAsset } from "@backend/schemas/types";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("media:write");
    if (session instanceof Response) return session;
    const { id } = await params;

    const asset = await findById<MediaAsset>("media", id);
    if (!asset) return error("Media asset not found", 404, 404);
    if (!isOptimizable(asset.mimeType)) {
        return error("Asset is not an optimizable image", 400);
    }

    // Clear stale variants in storage before regenerating.
    await deleteVariantFiles(asset);

    const result = await optimizeImageAsset({
        path: asset.path,
        mimeType: asset.mimeType,
        name: asset.name,
    });
    if (!result) return error("Optimization failed", 500, 500);

    const updated = await update<MediaAsset>(
        "media",
        id,
        {
            width: result.width,
            height: result.height,
            variants: result.variants,
            blurDataUrl: result.blurDataUrl,
            optimized: true,
        },
        session.sub,
    );
    if (!updated) return error("Media asset not found", 404, 404);

    audit(session, "media.optimize", "media", id);
    return json(updated);
}
