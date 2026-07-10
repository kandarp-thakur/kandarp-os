/**
 * Education API — export the collection.
 * GET /api/admin/education/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(educationConfig);
