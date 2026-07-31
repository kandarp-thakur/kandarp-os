/**
 * Certificates API — archive (soft-delete).
 * POST /api/admin/certificates/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(certificateConfig);
