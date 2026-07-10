/**
 * Blog API — restore an archived post.
 * POST /api/admin/blog/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(blogConfig);
