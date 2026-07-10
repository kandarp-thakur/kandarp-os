/**
 * Certificates API — archive (soft-delete).
 * POST /api/admin/certificates/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(certificateConfig);
