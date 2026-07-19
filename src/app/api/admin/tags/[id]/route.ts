/**
 * Tags API — /api/admin/tags/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { tagSchema, type Tag } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "tags",
    schema: tagSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "tag",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Tag,
    typeof tagSchema
>(config);
