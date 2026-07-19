/**
 * Services API — drag & drop reorder.
 * POST /api/admin/services/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(serviceConfig);
