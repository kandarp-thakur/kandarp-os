/**
 * Education API — import rows.
 * POST /api/admin/education/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(educationConfig);
