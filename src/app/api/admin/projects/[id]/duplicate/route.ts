/**
 * Projects API — duplicate a project.
 * POST /api/admin/projects/[id]/duplicate
 */

import { createCrudConfig, createDuplicateHandler } from "@/lib/admin/crud";
import { projectSchema, type Project } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "projects",
    schema: projectSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "project",
});

export const { POST } = createDuplicateHandler<Project, typeof projectSchema>(
    config,
);
