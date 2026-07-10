/**
 * Skills API — /api/admin/skills
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { skillSchema, type Skill } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "skills",
    schema: skillSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "skill",
});

export const { GET, POST } = createCollectionHandlers<
    Skill,
    typeof skillSchema
>(config);
