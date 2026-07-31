/**
 * Resumes API — restore an archived resume.
 * POST /api/admin/resumes/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(resumeConfig);
