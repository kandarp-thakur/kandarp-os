/**
 * Services API — restore an archived service.
 * POST /api/admin/services/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(serviceConfig);
