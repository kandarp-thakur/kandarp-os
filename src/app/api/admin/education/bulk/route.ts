/**
 * Education API — bulk actions.
 * POST /api/admin/education/bulk
 */

import { createBulkHandler } from "@/lib/admin/crud";
import { educationConfig } from "@/lib/admin/configs";

export const { POST } = createBulkHandler(educationConfig);
