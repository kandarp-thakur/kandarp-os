/**
 * Categories API — /api/admin/categories
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { categorySchema, type Category } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "categories",
    schema: categorySchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "category",
});

export const { GET, POST } = createCollectionHandlers<
    Category,
    typeof categorySchema
>(config);
