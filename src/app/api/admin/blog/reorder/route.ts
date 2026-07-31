/**
 * Blog API — drag & drop reorder.
 * POST /api/admin/blog/reorder
 */

import { createReorderHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createReorderHandler(blogConfig);
