/**
 * Projects API — /api/admin/projects/[id]
 *
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { projectSchema, type Project } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "projects",
    schema: projectSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "project",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Project,
    typeof projectSchema
>(config);
