/**
 * Skills API — bulk actions.
 * POST /api/admin/skills/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { skillConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(skillConfig);
