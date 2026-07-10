/**
 * Experience API — drag & drop reorder.
 * POST /api/admin/experience/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(experienceConfig);
