/**
 * Media library API — /api/admin/media
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
} from "@backend/controllers/crud";
import { mediaAssetSchema, type MediaAsset } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "media",
    schema: mediaAssetSchema,
    read: "media:read",
    write: "media:write",
    del: "media:delete",
    label: "media_asset",
});

export const { GET, POST } = createCollectionHandlers<
    MediaAsset,
    typeof mediaAssetSchema
>(config);
