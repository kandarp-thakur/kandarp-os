/**
 * Resumes API — import rows.
 * POST /api/admin/resumes/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(resumeConfig);
