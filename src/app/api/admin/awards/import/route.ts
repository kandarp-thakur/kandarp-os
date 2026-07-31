/**
 * Awards API — import rows.
 * POST /api/admin/awards/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(awardConfig);
