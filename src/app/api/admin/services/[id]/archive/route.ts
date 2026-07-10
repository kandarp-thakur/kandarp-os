/**
 * Services API — archive (soft-delete).
 * POST /api/admin/services/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { serviceConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(serviceConfig);
