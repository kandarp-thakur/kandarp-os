/**
 * Projects API — archive a project (soft-delete).
 * POST /api/admin/projects/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { projectConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(projectConfig);
