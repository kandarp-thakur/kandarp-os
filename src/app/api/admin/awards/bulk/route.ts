/**
 * Awards API — bulk actions.
 * POST /api/admin/awards/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(awardConfig);
