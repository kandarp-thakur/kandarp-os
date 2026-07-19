/**
 * Blog API — restore a previous version (undo).
 * POST /api/admin/blog/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(blogConfig);
