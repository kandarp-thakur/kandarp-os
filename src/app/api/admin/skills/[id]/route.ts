/**
 * Skills API — /api/admin/skills/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { skillSchema, type Skill } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "skills",
    schema: skillSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "skill",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Skill,
    typeof skillSchema
>(config);
