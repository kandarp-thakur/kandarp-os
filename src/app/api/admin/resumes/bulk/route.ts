/**
 * Resumes API — bulk actions.
 * POST /api/admin/resumes/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(resumeConfig);
