/**
 * Certificates API — /api/admin/certificates
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
} from "@backend/controllers/crud";
import { certificateSchema, type Certificate } from "@backend/schemas/types";

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
