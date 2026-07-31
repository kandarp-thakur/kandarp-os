/**
 * Awards API — /api/admin/awards
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
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

export const { GET, POST } = createCollectionHandlers<
    Award,
    typeof awardSchema
>(config);
