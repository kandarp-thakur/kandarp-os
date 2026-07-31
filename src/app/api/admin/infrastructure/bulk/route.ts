/**
 * Infrastructure API — bulk actions.
 * POST /api/admin/infrastructure/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(infraConfig);
