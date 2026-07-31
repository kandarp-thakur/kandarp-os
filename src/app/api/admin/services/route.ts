/**
 * Services API — /api/admin/services
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
} from "@backend/controllers/crud";
import { serviceSchema, type Service } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "services",
    schema: serviceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "service",
});

export const { GET, POST } = createCollectionHandlers<
    Service,
    typeof serviceSchema
>(config);
