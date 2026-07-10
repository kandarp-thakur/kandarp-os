/**
 * Certificates API — restore an archived certificate.
 * POST /api/admin/certificates/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(certificateConfig);
