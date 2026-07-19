/**
 * Certificates API — export the collection.
 * GET /api/admin/certificates/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(certificateConfig);
