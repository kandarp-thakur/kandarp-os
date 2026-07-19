/**
 * Infrastructure API — export the collection.
 * GET /api/admin/infrastructure/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(infraConfig);
