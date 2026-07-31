/**
 * Services API — export the collection.
 * GET /api/admin/services/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(serviceConfig);
