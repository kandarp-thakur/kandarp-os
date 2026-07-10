/**
 * Certificates API — bulk actions.
 * POST /api/admin/certificates/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { certificateConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(certificateConfig);
