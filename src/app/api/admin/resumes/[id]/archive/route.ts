/**
 * Resumes API — archive (soft-delete).
 * POST /api/admin/resumes/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(resumeConfig);
