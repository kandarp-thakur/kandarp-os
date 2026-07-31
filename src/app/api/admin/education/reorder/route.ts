/**
 * Education API — drag & drop reorder.
 * POST /api/admin/education/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(educationConfig);
