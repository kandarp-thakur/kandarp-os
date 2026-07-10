/**
 * Blog API — export the collection.
 * GET /api/admin/blog/export
 */

import { createExportHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { GET } = createExportHandler(blogConfig);
