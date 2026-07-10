/**
 * Blog API — import rows.
 * POST /api/admin/blog/import
 */

import { createImportHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createImportHandler(blogConfig);
