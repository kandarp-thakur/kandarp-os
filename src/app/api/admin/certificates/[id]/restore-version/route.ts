/**
 * Certificates API — restore a previous version (undo).
 * POST /api/admin/certificates/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(certificateConfig);
