/**
 * Experience API — import rows.
 * POST /api/admin/experience/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(experienceConfig);
