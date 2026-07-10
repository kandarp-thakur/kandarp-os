/**
 * Certificates API — drag & drop reorder.
 * POST /api/admin/certificates/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(certificateConfig);
