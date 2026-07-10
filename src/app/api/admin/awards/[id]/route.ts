/**
 * Awards API — /api/admin/awards/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { awardSchema, type Award } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "awards",
    schema: awardSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "award",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Award,
    typeof awardSchema
>(config);
