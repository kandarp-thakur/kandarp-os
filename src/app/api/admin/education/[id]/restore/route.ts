/**
 * Education API — restore an archived entry.
 * POST /api/admin/education/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { educationConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(educationConfig);
