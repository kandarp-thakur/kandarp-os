/**
 * Awards API — restore an archived award.
 * POST /api/admin/awards/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(awardConfig);
