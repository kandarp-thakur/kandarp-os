/**
 * Services API — export the collection.
 * GET /api/admin/services/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(serviceConfig);
