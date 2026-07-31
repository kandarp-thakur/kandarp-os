/**
 * Infrastructure edges API — /api/admin/infrastructure/edges/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { infraEdgeSchema, type InfraEdge } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "infraEdges",
    schema: infraEdgeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "infra_edge",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    InfraEdge,
    typeof infraEdgeSchema
>(config);
