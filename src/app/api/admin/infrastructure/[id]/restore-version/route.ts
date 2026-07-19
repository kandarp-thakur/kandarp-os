/**
 * Infrastructure API — restore a previous version (undo).
 * POST /api/admin/infrastructure/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(infraConfig);
