/**
 * Awards API — drag & drop reorder.
 * POST /api/admin/awards/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(awardConfig);
