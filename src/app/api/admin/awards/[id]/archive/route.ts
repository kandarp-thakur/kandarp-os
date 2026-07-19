/**
 * Awards API — archive (soft-delete).
 * POST /api/admin/awards/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { awardConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(awardConfig);
