/**
 * Projects API — bulk actions.
 * POST /api/admin/projects/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(projectConfig);
