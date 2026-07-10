/**
 * Projects API — restore an archived project.
 * POST /api/admin/projects/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(projectConfig);
