/**
 * Education API — export the collection.
 * GET /api/admin/education/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(educationConfig);
