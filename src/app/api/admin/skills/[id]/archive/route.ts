/**
 * Skills API — archive (soft-delete).
 * POST /api/admin/skills/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(skillConfig);
