/**
 * Projects API — archive a project (soft-delete).
 * POST /api/admin/projects/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { projectConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(projectConfig);
