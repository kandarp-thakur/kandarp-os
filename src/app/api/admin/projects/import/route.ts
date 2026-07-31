/**
 * Projects API — import rows.
 * POST /api/admin/projects/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(projectConfig);
