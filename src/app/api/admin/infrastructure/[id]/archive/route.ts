/**
 * Infrastructure API — archive (soft-delete).
 * POST /api/admin/infrastructure/[id]/archive
 */

import { createArchiveHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createArchiveHandler(infraConfig);
