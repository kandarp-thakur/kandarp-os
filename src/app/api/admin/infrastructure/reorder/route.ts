/**
 * Infrastructure API — drag & drop reorder.
 * POST /api/admin/infrastructure/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(infraConfig);
