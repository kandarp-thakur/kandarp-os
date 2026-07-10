/**
 * Resumes API — /api/admin/resumes/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { resumeSchema, type Resume } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "resumes",
    schema: resumeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "resume",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Resume,
    typeof resumeSchema
>(config);
