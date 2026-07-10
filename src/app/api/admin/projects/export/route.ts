/**
 * Projects API — export the collection.
 * GET /api/admin/projects/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(projectConfig);
