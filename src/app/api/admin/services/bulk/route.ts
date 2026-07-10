/**
 * Services API — bulk actions.
 * POST /api/admin/services/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(serviceConfig);
