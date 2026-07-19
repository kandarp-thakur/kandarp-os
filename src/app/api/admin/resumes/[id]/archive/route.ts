/**
 * Resumes API — archive (soft-delete).
 * POST /api/admin/resumes/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(resumeConfig);
