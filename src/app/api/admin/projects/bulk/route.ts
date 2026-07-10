/**
 * Projects API — bulk actions.
 * POST /api/admin/projects/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(projectConfig);
