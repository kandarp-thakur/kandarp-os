/**
 * Skills API — export the collection.
 * GET /api/admin/skills/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(skillConfig);
