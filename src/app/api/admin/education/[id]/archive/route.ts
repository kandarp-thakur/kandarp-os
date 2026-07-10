/**
 * Education API — archive (soft-delete).
 * POST /api/admin/education/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(educationConfig);
