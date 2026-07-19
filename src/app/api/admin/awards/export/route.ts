/**
 * Awards API — export the collection.
 * GET /api/admin/awards/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(awardConfig);
