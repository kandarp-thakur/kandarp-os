/**
 * Resumes API — /api/admin/resumes
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
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

export const { GET, POST } = createCollectionHandlers<
    Resume,
    typeof resumeSchema
>(config);
