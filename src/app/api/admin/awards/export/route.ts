/**
 * Awards API — export the collection.
 * GET /api/admin/awards/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(awardConfig);
