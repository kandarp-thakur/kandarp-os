/**
 * Awards API — /api/admin/awards/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { awardSchema, type Award } from "@backend/schemas/types";

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
