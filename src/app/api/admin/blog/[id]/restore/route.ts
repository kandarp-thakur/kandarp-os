/**
 * Blog API — restore an archived post.
 * POST /api/admin/blog/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(blogConfig);
