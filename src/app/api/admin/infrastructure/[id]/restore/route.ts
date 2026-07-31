/**
 * Infrastructure API — restore an archived node.
 * POST /api/admin/infrastructure/[id]/restore
 */

import { createRestoreHandler } from "@backend/controllers/crud";
import { infraConfig } from "@backend/controllers/configs";

export const { POST } = createRestoreHandler(infraConfig);
