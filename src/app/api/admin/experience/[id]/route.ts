/**
 * Experience API — /api/admin/experience/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { experienceSchema, type Experience } from "@backend/schemas/types";

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
