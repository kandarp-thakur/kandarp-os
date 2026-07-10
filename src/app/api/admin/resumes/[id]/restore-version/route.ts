/**
 * Resumes API — restore a previous version (undo).
 * POST /api/admin/resumes/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(resumeConfig);
