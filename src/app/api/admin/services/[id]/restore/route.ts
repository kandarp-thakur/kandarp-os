/**
 * Services API — restore an archived service.
 * POST /api/admin/services/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(serviceConfig);
