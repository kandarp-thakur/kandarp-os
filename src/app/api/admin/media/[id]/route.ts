/**
 * Media library API — /api/admin/media/[id]
 * Per-entity: get + update + delete.
 *
 * The DELETE handler is overridden (not the factory default) so that:
 *   1. The asset's files on disk (original + all generated variants) are
 *      removed — the factory delete only drops the DB row.
 *   2. Any entity referencing this asset by id is cleaned up. Today that's
 *      the Profile singleton (`profileImageId`); the same hook will cover
 *      blog covers, project thumbnails, logos, etc. as they adopt the Media
 *      id contract. This is the "fallback" guarantee: deleting the selected
 *      image automatically restores the placeholder, never breaking layout.
 */

import { audit, error, json, requirePermission } from "@/lib/admin/api";
import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { findById, list, remove, update } from "@/lib/admin/repo";
import { revalidateCollection } from "@/lib/admin/revalidate";
import { deleteAssetFiles } from "@/lib/admin/image-optimization";
import {
    mediaAssetSchema,
    type MediaAsset,
    type Profile,
} from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "media",
    schema: mediaAssetSchema,
    read: "media:read",
    write: "media:write",
    del: "media:delete",
    label: "media_asset",
});

const { GET, PATCH } = createEntityHandlers<
    MediaAsset,
    typeof mediaAssetSchema
>(config);

/**
 * Delete a media asset: remove its DB row, delete its files on disk, and null
 * out any references to it (Profile.profileImageId today; extensible).
 */
async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requirePermission(config.del);
    if (session instanceof Response) return session;
    const { id } = await params;

    const asset = findById<MediaAsset>("media", id);
    if (!asset) return error(`${config.label} not found`, 404, 404);

    // 1. Null out references before removing the row so a concurrent read
    //    never resolves a dangling id. (Profile is the current consumer.)
    await nullOutMediaReferences(id);

    // 2. Remove the DB row.
    const ok = await remove("media", id);
    if (!ok) return error(`${config.label} not found`, 404, 404);

    // 3. Delete the files on disk (best-effort).
    deleteAssetFiles(asset);

    audit(session, `${config.label}.delete`, "media", id);
    revalidateCollection("media");
    return json({ ok: true });
}

/**
 * Null out every stored reference to a media id. Today only the Profile
 * singleton references media (`profileImageId`). As blog covers, project
 * thumbnails, etc. adopt the Media id contract, add their cleanup here so
 * deleting an asset always restores the fallback everywhere.
 */
async function nullOutMediaReferences(mediaId: string): Promise<void> {
    // Profile singleton.
    const profiles = list<Profile>("profiles");
    for (const p of profiles) {
        if (p.profileImageId === mediaId) {
            await update<Profile>(
                "profiles",
                p.id,
                { profileImageId: null },
                undefined,
            );
        }
    }
}

export { GET, PATCH, DELETE };
