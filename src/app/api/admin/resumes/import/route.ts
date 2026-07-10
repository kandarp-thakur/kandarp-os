/**
 * Resumes API — import rows.
 * POST /api/admin/resumes/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(resumeConfig);
