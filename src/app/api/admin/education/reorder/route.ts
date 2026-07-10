/**
 * Education API — drag & drop reorder.
 * POST /api/admin/education/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(educationConfig);
