/**
 * Experience API — import rows.
 * POST /api/admin/experience/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(experienceConfig);
