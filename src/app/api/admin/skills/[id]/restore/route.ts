/**
 * Skills API — restore an archived skill.
 * POST /api/admin/skills/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(skillConfig);
