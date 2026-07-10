/**
 * Infrastructure API — restore an archived node.
 * POST /api/admin/infrastructure/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(infraConfig);
