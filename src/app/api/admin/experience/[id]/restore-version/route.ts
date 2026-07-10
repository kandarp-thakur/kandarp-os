/**
 * Experience API — restore a previous version (undo).
 * POST /api/admin/experience/[id]/restore-version
 */

import { createRestoreVersionHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreVersionHandler(experienceConfig);
