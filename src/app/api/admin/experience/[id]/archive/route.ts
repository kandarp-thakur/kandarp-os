/**
 * Experience API — archive (soft-delete).
 * POST /api/admin/experience/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(experienceConfig);
