/**
 * Projects API — drag & drop reorder.
 * POST /api/admin/projects/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(projectConfig);
