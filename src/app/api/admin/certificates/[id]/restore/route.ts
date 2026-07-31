/**
 * Certificates API — restore an archived certificate.
 * POST /api/admin/certificates/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(certificateConfig);
