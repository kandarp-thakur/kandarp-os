/**
 * Services API — /api/admin/services
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { serviceSchema, type Service } from "@/lib/admin/types";

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
