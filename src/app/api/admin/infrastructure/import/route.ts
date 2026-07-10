/**
 * Infrastructure API — import rows.
 * POST /api/admin/infrastructure/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(infraConfig);
