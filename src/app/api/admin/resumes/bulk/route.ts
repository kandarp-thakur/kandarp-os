/**
 * Resumes API — bulk actions.
 * POST /api/admin/resumes/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(resumeConfig);
