/**
 * Experience API — restore an archived entry.
 * POST /api/admin/experience/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { experienceConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(experienceConfig);
