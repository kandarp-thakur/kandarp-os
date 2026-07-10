/**
 * Infrastructure nodes API — /api/admin/infrastructure/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { infraNodeSchema, type InfraNode } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "infraNodes",
    schema: infraNodeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "infra_node",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    InfraNode,
    typeof infraNodeSchema
>(config);
