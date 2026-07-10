/**
 * Services API — drag & drop reorder.
 * POST /api/admin/services/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(serviceConfig);
