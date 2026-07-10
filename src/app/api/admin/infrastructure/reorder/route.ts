/**
 * Infrastructure API — drag & drop reorder.
 * POST /api/admin/infrastructure/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(infraConfig);
