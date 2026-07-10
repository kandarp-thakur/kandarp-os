/**
 * Awards API — restore an archived award.
 * POST /api/admin/awards/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(awardConfig);
