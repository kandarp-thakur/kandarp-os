/**
 * Skills API — drag & drop reorder.
 * POST /api/admin/skills/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(skillConfig);
