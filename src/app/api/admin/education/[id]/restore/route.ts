/**
 * Education API — restore an archived entry.
 * POST /api/admin/education/[id]/restore
 */

import { createRestoreHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createRestoreHandler(educationConfig);
