/**
 * Skills API — restore an archived skill.
 * POST /api/admin/skills/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(skillConfig);
