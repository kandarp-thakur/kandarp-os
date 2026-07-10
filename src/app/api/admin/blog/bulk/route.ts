/**
 * Blog API — bulk actions.
 * POST /api/admin/blog/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(blogConfig);
