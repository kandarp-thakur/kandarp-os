/**
 * Tags API — /api/admin/tags
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
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

export const { GET, POST } = createCollectionHandlers<Tag, typeof tagSchema>(
    config,
);
