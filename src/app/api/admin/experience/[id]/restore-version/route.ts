/**
 * Experience API — restore a previous version (undo).
 * POST /api/admin/experience/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreVersionHandler(experienceConfig);
