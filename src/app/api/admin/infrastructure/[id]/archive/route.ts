/**
 * Infrastructure API — archive (soft-delete).
 * POST /api/admin/infrastructure/[id]/archive
 */

import { createArchiveHandler } from "@/lib/admin/crud";
import { infraConfig } from "@/lib/admin/configs";

export const { POST } = createArchiveHandler(infraConfig);
