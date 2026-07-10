/**
 * Tags API — /api/admin/tags/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { tagSchema, type Tag } from "@/lib/admin/types";

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
