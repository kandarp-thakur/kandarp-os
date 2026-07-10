/**
 * Resumes API — drag & drop reorder.
 * POST /api/admin/resumes/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(resumeConfig);
