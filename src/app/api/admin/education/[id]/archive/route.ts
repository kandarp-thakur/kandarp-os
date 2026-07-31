/**
 * Education API — archive (soft-delete).
 * POST /api/admin/education/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(educationConfig);
