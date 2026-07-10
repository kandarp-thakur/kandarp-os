/**
 * Certificates API — export the collection.
 * GET /api/admin/certificates/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(certificateConfig);
