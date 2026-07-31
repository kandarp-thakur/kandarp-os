/**
 * Awards API — drag & drop reorder.
 * POST /api/admin/awards/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(awardConfig);
