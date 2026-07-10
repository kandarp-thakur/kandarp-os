/**
 * Infrastructure API — bulk actions.
 * POST /api/admin/infrastructure/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(infraConfig);
