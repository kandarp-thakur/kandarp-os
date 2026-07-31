/**
 * Blog API — bulk actions.
 * POST /api/admin/blog/bulk
 */

import { createBulkHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createBulkHandler(blogConfig);
