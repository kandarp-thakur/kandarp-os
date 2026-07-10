/**
 * Skills API — import rows.
 * POST /api/admin/skills/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(skillConfig);
