/**
 * Infrastructure API — import rows.
 * POST /api/admin/infrastructure/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(infraConfig);
