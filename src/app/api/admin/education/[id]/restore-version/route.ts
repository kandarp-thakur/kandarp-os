/**
 * Education API — restore a previous version (undo).
 * POST /api/admin/education/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(educationConfig);
