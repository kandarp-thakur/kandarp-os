/**
 * Certificates API — /api/admin/certificates
 * Collection root: list + create.
 */

import { createCollectionHandlers, createCrudConfig } from "@/lib/admin/crud";
import { certificateSchema, type Certificate } from "@/lib/admin/types";

const config = createCrudConfig({
    collection: "certificates",
    schema: certificateSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "certificate",
});

export const { GET, POST } = createCollectionHandlers<
    Certificate,
    typeof certificateSchema
>(config);
