/**
 * Education API — restore a previous version (undo).
 * POST /api/admin/education/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(educationConfig);
