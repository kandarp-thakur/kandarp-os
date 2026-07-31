/**
 * Experience API — bulk actions.
 * POST /api/admin/experience/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(experienceConfig);
