/**
 * Resumes API — drag & drop reorder.
 * POST /api/admin/resumes/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(resumeConfig);
