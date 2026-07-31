/**
 * Skills API — export the collection.
 * GET /api/admin/skills/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(skillConfig);
