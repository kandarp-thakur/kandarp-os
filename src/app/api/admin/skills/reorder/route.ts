/**
 * Skills API — drag & drop reorder.
 * POST /api/admin/skills/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(skillConfig);
