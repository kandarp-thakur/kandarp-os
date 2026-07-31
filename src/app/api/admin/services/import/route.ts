/**
 * Services API — import rows.
 * POST /api/admin/services/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(serviceConfig);
