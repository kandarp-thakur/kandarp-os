/**
 * Blog API — export the collection.
 * GET /api/admin/blog/export
 */

import { createExportHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { GET } = createExportHandler(blogConfig);
