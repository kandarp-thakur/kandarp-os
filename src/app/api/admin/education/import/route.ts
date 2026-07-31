/**
 * Education API — import rows.
 * POST /api/admin/education/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(educationConfig);
