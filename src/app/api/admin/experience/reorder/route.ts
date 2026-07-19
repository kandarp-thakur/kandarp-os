/**
 * Experience API — drag & drop reorder.
 * POST /api/admin/experience/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(experienceConfig);
