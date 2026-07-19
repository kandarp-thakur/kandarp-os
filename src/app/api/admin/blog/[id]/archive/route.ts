/**
 * Blog API — archive a post (soft-delete).
 * POST /api/admin/blog/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { blogConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(blogConfig);
