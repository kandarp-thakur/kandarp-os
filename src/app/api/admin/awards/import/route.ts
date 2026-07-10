/**
 * Awards API — import rows.
 * POST /api/admin/awards/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(awardConfig);
