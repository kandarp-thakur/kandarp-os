/**
 * Certificates API — import rows.
 * POST /api/admin/certificates/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(certificateConfig);
