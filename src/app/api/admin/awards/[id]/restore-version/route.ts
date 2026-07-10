/**
 * Awards API — restore a previous version (undo).
 * POST /api/admin/awards/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(awardConfig);
