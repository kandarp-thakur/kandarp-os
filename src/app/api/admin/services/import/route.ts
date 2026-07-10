/**
 * Services API — import rows.
 * POST /api/admin/services/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(serviceConfig);
