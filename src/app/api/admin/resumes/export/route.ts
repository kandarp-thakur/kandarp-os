/**
 * Resumes API — export the collection.
 * GET /api/admin/resumes/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { resumeConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(resumeConfig);
