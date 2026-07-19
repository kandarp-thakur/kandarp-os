/**
 * Certificates API — drag & drop reorder.
 * POST /api/admin/certificates/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(certificateConfig);
