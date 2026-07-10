/**
 * Skills API — bulk actions.
 * POST /api/admin/skills/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { skillConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(skillConfig);
