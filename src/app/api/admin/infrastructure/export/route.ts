/**
 * Infrastructure API — export the collection.
 * GET /api/admin/infrastructure/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(infraConfig);
