/**
 * Projects API — /api/admin/projects
 *
 * Full CRUD via the factory. Collection root: list + create.
 * Per-entity routes live in `[id]/route.ts`.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { projectSchema, type Project } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "projects",
    schema: projectSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "project",
});

export const { GET, POST } = createCollectionHandlers<
    Project,
    typeof projectSchema
>(config);
