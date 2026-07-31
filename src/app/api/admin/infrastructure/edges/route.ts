/**
 * Infrastructure edges API — /api/admin/infrastructure/edges
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
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

export const { GET, POST } = createCollectionHandlers<
    InfraEdge,
    typeof infraEdgeSchema
>(config);
