/**
 * Role-Based Access Control — the authorization matrix.
 *
 * Every admin action resolves to a `Permission`. Each role grants a set of
 * permissions. The API layer and the UI both consult this matrix: the API
 * enforces it on every request (defense in depth), and the UI hides/disables
 * actions the current user can't perform (good UX).
 *
 * Roles (least → most privileged):
 *   • viewer  — read everything; no writes.
 *   • editor  — create/edit/publish content (projects, blog, experience…);
 *               cannot manage users, settings, or destructive ops.
 *   • admin   — everything except owner-only ops (transfer ownership, delete
 *               the owner, wipe backups).
 *   • owner   — full control, including user management + danger zone.
 *
 * @see docs/security — RBAC, audit logs, session expiration.
 */

import type { AdminRole } from "@backend/auth/auth";

/** A granular capability. The matrix below maps roles → permission sets. */
export type Permission =
    // Content — read
    | "content:read"
    // Content — write (create/update/publish/archive/duplicate)
    | "content:write"
    // Content — delete (irreversible)
    | "content:delete"
    // Media library
    | "media:read"
    | "media:write"
    | "media:delete"
    // SEO + settings
    | "settings:read"
    | "settings:write"
    // Analytics
    | "analytics:read"
    // Users + RBAC
    | "users:read"
    | "users:write"
    | "users:delete"
    // Activity logs + audit
    | "audit:read"
    // Backup / restore / danger zone
    | "backup:read"
    | "backup:write"
    // Owner-only: transfer ownership, delete owner, wipe data
    | "owner:super";

/** The role → permission matrix. Order matters: each tier is a superset. */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    viewer: [
        "content:read",
        "media:read",
        "settings:read",
        "analytics:read",
        "audit:read",
        "backup:read",
    ],
    editor: [
        "content:read",
        "content:write",
        "media:read",
        "media:write",
        "settings:read",
        "analytics:read",
        "audit:read",
        "backup:read",
    ],
    admin: [
        "content:read",
        "content:write",
        "content:delete",
        "media:read",
        "media:write",
        "media:delete",
        "settings:read",
        "settings:write",
        "analytics:read",
        "users:read",
        "users:write",
        "audit:read",
        "backup:read",
        "backup:write",
    ],
    owner: [
        "content:read",
        "content:write",
        "content:delete",
        "media:read",
        "media:write",
        "media:delete",
        "settings:read",
        "settings:write",
        "analytics:read",
        "users:read",
        "users:write",
        "users:delete",
        "audit:read",
        "backup:read",
        "backup:write",
        "owner:super",
    ],
};

/** Does `role` grant `permission`? */
export function can(role: AdminRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

/** Does `role` grant *all* of `permissions`? */
export function canAll(role: AdminRole, permissions: Permission[]): boolean {
    return permissions.every((p) => can(role, p));
}

/** Does `role` grant *any* of `permissions`? */
export function canAny(role: AdminRole, permissions: Permission[]): boolean {
    return permissions.some((p) => can(role, p));
}

/** Human-readable role labels for the UI. */
export const ROLE_LABELS: Record<AdminRole, string> = {
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
};

/** Short role descriptions for the user-management screen. */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
    owner: "Full control — including user management, ownership transfer, and the danger zone.",
    admin: "Manage all content, media, settings, and backups. Cannot manage owners or wipe data.",
    editor: "Create, edit, and publish content + media. Read-only access to settings and analytics.",
    viewer: "Read-only access to all content, analytics, and logs. No writes.",
};

/** The ordered role list (for role pickers). */
export const ROLES: AdminRole[] = ["owner", "admin", "editor", "viewer"];
