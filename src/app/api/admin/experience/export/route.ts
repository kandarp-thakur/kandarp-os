/**
 * Experience API — export the collection.
 * GET /api/admin/experience/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(experienceConfig);
