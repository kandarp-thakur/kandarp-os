/**
 * Experience API — export the collection.
 * GET /api/admin/experience/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(experienceConfig);
