/**
 * Skills API — import rows.
 * POST /api/admin/skills/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(skillConfig);
