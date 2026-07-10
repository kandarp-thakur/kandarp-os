/**
 * Resumes API — export the collection.
 * GET /api/admin/resumes/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { resumeConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(resumeConfig);
