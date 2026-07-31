/**
 * Resumes API — /api/admin/resumes/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { resumeSchema, type Resume } from "@backend/schemas/types";

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
