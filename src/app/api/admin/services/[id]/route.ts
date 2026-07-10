/**
 * Services API — /api/admin/services/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { serviceSchema, type Service } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "services",
    schema: serviceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "service",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Service,
    typeof serviceSchema
>(config);
