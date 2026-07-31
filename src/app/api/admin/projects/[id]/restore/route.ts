/**
 * Projects API — restore an archived project.
 * POST /api/admin/projects/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(projectConfig);
