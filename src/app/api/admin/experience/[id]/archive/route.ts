/**
 * Experience API — archive (soft-delete).
 * POST /api/admin/experience/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(experienceConfig);
