/**
 * Resumes API — restore a previous version (undo).
 * POST /api/admin/resumes/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(resumeConfig);
