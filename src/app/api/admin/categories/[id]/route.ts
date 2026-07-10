/**
 * Categories API — /api/admin/categories/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { categorySchema, type Category } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "categories",
    schema: categorySchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "category",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Category,
    typeof categorySchema
>(config);
