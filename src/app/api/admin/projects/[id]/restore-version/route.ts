/**
 * Projects API — restore a previous version (undo).
 * POST /api/admin/projects/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(projectConfig);
