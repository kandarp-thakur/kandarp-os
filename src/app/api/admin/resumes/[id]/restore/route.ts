/**
 * Resumes API — restore an archived resume.
 * POST /api/admin/resumes/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(resumeConfig);
