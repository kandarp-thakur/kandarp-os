/**
 * Skills API — archive (soft-delete).
 * POST /api/admin/skills/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(skillConfig);
