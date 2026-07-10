/**
 * Projects API — import rows.
 * POST /api/admin/projects/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(projectConfig);
