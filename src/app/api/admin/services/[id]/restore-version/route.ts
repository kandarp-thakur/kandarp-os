/**
 * Services API — restore a previous version (undo).
 * POST /api/admin/services/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { serviceConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(serviceConfig);
