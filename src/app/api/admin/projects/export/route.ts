/**
 * Projects API — export the collection.
 * GET /api/admin/projects/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(projectConfig);
