/**
 * Blog API — restore a previous version (undo).
 * POST /api/admin/blog/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(blogConfig);
