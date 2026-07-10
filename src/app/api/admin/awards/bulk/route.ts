/**
 * Awards API — bulk actions.
 * POST /api/admin/awards/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(awardConfig);
