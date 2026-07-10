/**
 * Certificates API — restore a previous version (undo).
 * POST /api/admin/certificates/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(certificateConfig);
