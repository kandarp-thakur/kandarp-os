/**
 * Certificates API — /api/admin/certificates/[id]
 * Per-entity: get + update + delete.
 */

import { createCrudConfig, createEntityHandlers } from "@/lib/admin/crud";
import { certificateSchema, type Certificate } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "certificates",
    schema: certificateSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "certificate",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    Certificate,
    typeof certificateSchema
>(config);
