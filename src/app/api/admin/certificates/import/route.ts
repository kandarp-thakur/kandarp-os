/**
 * Certificates API — import rows.
 * POST /api/admin/certificates/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(certificateConfig);
