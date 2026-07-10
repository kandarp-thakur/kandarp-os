/**
 * Infrastructure API — restore a previous version (undo).
 * POST /api/admin/infrastructure/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(infraConfig);
