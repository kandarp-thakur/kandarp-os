/**
 * Education API — bulk actions.
 * POST /api/admin/education/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(educationConfig);
