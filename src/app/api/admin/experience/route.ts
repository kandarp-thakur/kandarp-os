/**
 * Experience API — /api/admin/experience
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { experienceSchema, type Experience } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "experience",
    schema: experienceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "experience",
});

export const { GET, POST } = createCollectionHandlers<
    Experience,
    typeof experienceSchema
>(config);
