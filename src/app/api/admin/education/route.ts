/**
 * Education API — /api/admin/education
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { educationSchema, type Education } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "education",
    schema: educationSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "education",
});

export const { GET, POST } = createCollectionHandlers<
    Education,
    typeof educationSchema
>(config);
