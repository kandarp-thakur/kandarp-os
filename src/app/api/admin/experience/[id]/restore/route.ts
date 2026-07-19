/**
 * Experience API — restore an archived entry.
 * POST /api/admin/experience/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { experienceConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(experienceConfig);
