/**
 * Infrastructure nodes API — /api/admin/infrastructure
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { infraNodeSchema, type InfraNode } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "infraNodes",
    schema: infraNodeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "infra_node",
});

export const { GET, POST } = createCollectionHandlers<
    InfraNode,
    typeof infraNodeSchema
>(config);
