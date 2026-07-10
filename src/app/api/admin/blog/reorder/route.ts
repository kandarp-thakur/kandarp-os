/**
 * Blog API — drag & drop reorder.
 * POST /api/admin/blog/reorder
 */

import { createReorderHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createReorderHandler(blogConfig);
