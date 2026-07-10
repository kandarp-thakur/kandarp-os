/**
 * Blog API — archive a post (soft-delete).
 * POST /api/admin/blog/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { blogConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(blogConfig);
