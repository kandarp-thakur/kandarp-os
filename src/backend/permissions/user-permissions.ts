/**
 * Server-side permission resolution for per-user RBAC overrides.
 *
 * The role matrix provides the default decision. A matching UserPermission row
 * takes precedence, allowing an explicit grant or denial without minting a new
 * session token. Keeping this database lookup at authorization time also makes
 * permission changes effective immediately for active sessions.
 */

import { prisma } from "@backend/database/db";
import { canWithOverride, type Permission } from "@backend/permissions/rbac";
import type { AdminRole } from "@backend/auth/auth";

/** Resolve a permission using the user's explicit override before role defaults. */
export async function canUser(
    userId: string,
    role: AdminRole,
    permission: Permission,
): Promise<boolean> {
    const override = await prisma.userPermission.findFirst({
        where: {
            userId,
            permission: { name: permission },
        },
        select: { granted: true },
    });

    return canWithOverride(role, permission, override?.granted);
}
