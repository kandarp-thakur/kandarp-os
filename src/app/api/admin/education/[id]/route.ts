/**
 * Education API — /api/admin/education/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { educationSchema, type Education } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "education",
    schema: educationSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "education",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Education,
    typeof educationSchema
>(config);
