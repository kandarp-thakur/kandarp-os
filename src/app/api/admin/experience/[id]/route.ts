/**
 * Experience API — /api/admin/experience/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { experienceSchema, type Experience } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "experience",
    schema: experienceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "experience",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Experience,
    typeof experienceSchema
>(config);
