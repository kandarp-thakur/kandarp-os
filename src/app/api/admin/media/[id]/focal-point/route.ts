/**
 * PATCH /api/admin/media/[id]/focal-point — set the focal point of an image
 * asset (media:write).
 *
 * Accepts `{ x, y }` normalized 0–1 coordinates, or `null` to clear it. The
 * focal point drives `object-position` on the public site so cover-fit keeps
 * the subject in frame. Does not modify the image — only the stored anchor.
 */

import { z } from "zod";

import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { findById, update } from "@backend/repositories/repo";
import { focalPointSchema } from "@backend/schemas/types";
import type { MediaAsset } from "@backend/schemas/types";

const bodySchema = z.object({
    focalPoint: focalPointSchema.nullable(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission("media:write");
    if (session instanceof Response) return session;
    const { id } = await params;

    const asset = findById<MediaAsset>("media", id);
    if (!asset) return error("Media asset not found", 404, 404);

    const body = await parseBody(req, bodySchema);
    if (body instanceof Response) return body;

    const updated = await update<MediaAsset>(
        "media",
        id,
        { focalPoint: body.focalPoint },
        session.sub,
    );
    if (!updated) return error("Media asset not found", 404, 404);

    audit(session, "media.focal_point", "media", id);
    return json(updated);
}
