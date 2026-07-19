/**
 * Awards API — restore a previous version (undo).
 * POST /api/admin/awards/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(awardConfig);
