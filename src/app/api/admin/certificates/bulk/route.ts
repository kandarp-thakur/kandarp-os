/**
 * Certificates API — bulk actions.
 * POST /api/admin/certificates/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { certificateConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(certificateConfig);
