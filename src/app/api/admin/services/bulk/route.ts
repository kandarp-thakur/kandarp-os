/**
 * Services API — bulk actions.
 * POST /api/admin/services/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(serviceConfig);
