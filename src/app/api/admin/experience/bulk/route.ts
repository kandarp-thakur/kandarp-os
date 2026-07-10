/**
 * Experience API — bulk actions.
 * POST /api/admin/experience/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(experienceConfig);
