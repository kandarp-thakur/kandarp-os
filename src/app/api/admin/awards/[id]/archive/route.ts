/**
 * Awards API — archive (soft-delete).
 * POST /api/admin/awards/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { awardConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(awardConfig);
