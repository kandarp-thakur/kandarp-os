/**
 * Skills API — restore a previous version (undo).
 * POST /api/admin/skills/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(skillConfig);
