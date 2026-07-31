/**
 * Blog API — import rows.
 * POST /api/admin/blog/import
 */

import { createImportHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createImportHandler(blogConfig);
