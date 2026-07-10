/**
 * Skills API — restore a previous version (undo).
 * POST /api/admin/skills/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(skillConfig);
