/**
 * Education API — /api/admin/education/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { educationSchema, type Education } from "@backend/schemas/types";

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
