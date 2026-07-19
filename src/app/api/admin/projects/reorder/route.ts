/**
 * Projects API — drag & drop reorder.
 * POST /api/admin/projects/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(projectConfig);
