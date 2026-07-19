/**
 * Services API — archive (soft-delete).
 * POST /api/admin/services/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(serviceConfig);
