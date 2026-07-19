/**
 * Projects API — restore a previous version (undo).
 * POST /api/admin/projects/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(projectConfig);
