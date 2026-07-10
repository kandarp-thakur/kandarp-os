/**
 * Services API — restore a previous version (undo).
 * POST /api/admin/services/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(serviceConfig);
