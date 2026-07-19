/**
 * Database seed — runs after `prisma migrate deploy` / `prisma migrate dev`.
 *
 * Two phases:
 *
 *   1. **System data** (roles, permissions, role↔permission links, the owner
 *      user). This is seeded directly via the Prisma client because it must
 *      exist before the application's repository layer can function — the
 *      repo layer's `create()` writes audit fields (`createdById`) that
 *      reference a User, and authorization checks consult the Role↔Permission
 *      matrix. Seeding system data through the repo would be circular.
 *
 *   2. **Demo content** (projects, experience, skills, settings, profile,
 *      site customization, …). This is delegated to `seedStore()` in
 *      `src/lib/admin/seed.ts`, which uses the repository layer and is
 *      idempotent (only writes when a collection is empty). The same
 *      `seedStore()` runs lazily on first admin request, so this phase is a
 *      convenience — it pre-populates the DB so the admin console isn't empty
 *      on first login.
 *
 * Idempotency: every upsert uses `where` clauses on unique fields, so running
 * `npm run db:seed` multiple times is safe — existing rows are updated in
 * place, not duplicated.
 *
 * Run with:  npm run db:seed   (after `npm run db:migrate`)
 *
 * @see docs/backend/README.md — quick start, seeding.
 */

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/backend/auth/auth";
import { adminEnv } from "@/backend/config/env";
import { ROLE_PERMISSIONS } from "@/backend/permissions/rbac";
import { seedStore } from "@/backend/services/seed";

// ── Prisma client (standalone — not the Next.js singleton) ──────────────────
// The seed script runs in its own process (`tsx prisma/seed.ts`), so it gets
// its own PrismaClient. We don't need the globalThis cache here.
const prisma = new PrismaClient();

// ── Role definitions ────────────────────────────────────────────────────────
// The four built-in roles. `name` is the machine name matched by the RBAC
// matrix in `src/backend/permissions/rbac.ts`; `label` is the human-readable
// name shown in the admin UI.
const SYSTEM_ROLES = [
    {
        name: "viewer",
        label: "Viewer",
        description: "Read-only access to all content, media, and settings.",
    },
    {
        name: "editor",
        label: "Editor",
        description:
            "Create, edit, and publish content. Cannot manage users or settings.",
    },
    {
        name: "admin",
        label: "Admin",
        description:
            "Full content + media + settings access. Cannot manage the owner or wipe backups.",
    },
    {
        name: "owner",
        label: "Owner",
        description:
            "Full control, including user management, ownership transfer, and the danger zone.",
    },
] as const;

// ── Permission definitions ─────────────────────────────────────────────────
// Every granular capability. The `name` is the string checked by
// `requirePermission()` in the API layer. Descriptions are for the admin UI.
const ALL_PERMISSIONS = [
    { name: "content:read", description: "View content collections." },
    {
        name: "content:write",
        description: "Create, edit, publish, archive, and duplicate content.",
    },
    {
        name: "content:delete",
        description: "Permanently delete content (irreversible).",
    },
    { name: "media:read", description: "View the media library." },
    {
        name: "media:write",
        description: "Upload, optimize, and crop media assets.",
    },
    { name: "media:delete", description: "Delete media assets." },
    {
        name: "settings:read",
        description: "View site settings, SEO, and configuration.",
    },
    {
        name: "settings:write",
        description: "Edit site settings, SEO, and configuration.",
    },
    { name: "analytics:read", description: "View analytics and traffic data." },
    { name: "users:read", description: "View the user list and roles." },
    {
        name: "users:write",
        description: "Create, edit, and assign roles to users.",
    },
    { name: "users:delete", description: "Delete users (not the owner)." },
    { name: "audit:read", description: "View activity logs and audit trail." },
    { name: "backup:read", description: "Download backups." },
    {
        name: "backup:write",
        description: "Restore backups and access the danger zone.",
    },
    {
        name: "owner:super",
        description: "Owner-only: transfer ownership, delete owner, wipe data.",
    },
] as const;

/**
 * Seed the RBAC system data: roles, permissions, and the role↔permission
 * matrix. Idempotent — uses upserts keyed on the unique `name` field.
 */
async function seedRbac(): Promise<void> {
    // 1. Upsert all permissions.
    for (const perm of ALL_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description },
            create: { name: perm.name, description: perm.description },
        });
    }

    // 2. Upsert all system roles.
    for (const role of SYSTEM_ROLES) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {
                label: role.label,
                description: role.description,
                isSystem: true,
            },
            create: {
                name: role.name,
                label: role.label,
                description: role.description,
                isSystem: true,
            },
        });
    }

    // 3. Link roles → permissions via the ROLE_PERMISSIONS matrix.
    //    For each role, ensure a RolePermission row exists for every
    //    permission the matrix grants. We delete + recreate to stay in sync
    //    if the matrix changes (safer than diffing).
    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await prisma.role.findUnique({
            where: { name: roleName },
        });
        if (!role) continue; // Should never happen — we just upserted it.

        // Fetch the permission rows for this role's permission names.
        const permissions = await prisma.permission.findMany({
            where: { name: { in: permNames } },
            select: { id: true, name: true },
        });

        // Delete existing links for this role (clean slate).
        await prisma.rolePermission.deleteMany({
            where: { roleId: role.id },
        });

        // Recreate all links from the matrix.
        await prisma.rolePermission.createMany({
            data: permissions.map((p) => ({
                roleId: role.id,
                permissionId: p.id,
            })),
            skipDuplicates: true,
        });
    }

    console.log(
        `  ✓ RBAC: ${SYSTEM_ROLES.length} roles, ${ALL_PERMISSIONS.length} permissions, ` +
        `${Object.values(ROLE_PERMISSIONS).flat().length} role↔permission links`,
    );
}

/**
 * Seed the owner user — the first admin account. The email + password come
 * from env (`ADMIN_OWNER_EMAIL` / `ADMIN_OWNER_PASSWORD`). The password is
 * hashed with Argon2id before storage. Idempotent — if the owner already
 * exists (by email), the password hash is updated to match the current env
 * value (useful for dev resets).
 */
async function seedOwnerUser(): Promise<void> {
    const email = adminEnv.ownerEmail;
    const password = adminEnv.ownerPassword;
    const passwordHash = await hashPassword(password);

    const ownerRole = await prisma.role.findUnique({
        where: { name: "owner" },
    });
    if (!ownerRole) {
        throw new Error("Owner role not found — run seedRbac() first.");
    }

    await prisma.user.upsert({
        where: { email },
        update: { passwordHash, roleId: ownerRole.id, status: "ACTIVE" },
        create: {
            name: "Owner",
            email,
            passwordHash,
            roleId: ownerRole.id,
            status: "ACTIVE",
            bio: "",
        },
    });

    console.log(`  ✓ Owner user: ${email}`);
}

/**
 * Main entry point. Seeds system data, then demo content, then disconnects.
 */
async function main(): Promise<void> {
    console.log("🌱 Seeding database…\n");

    // Phase 1: System data (roles, permissions, owner user).
    console.log("Phase 1 — System data (RBAC + owner):");
    await seedRbac();
    await seedOwnerUser();

    // Phase 2: Demo content (projects, experience, skills, settings, …).
    // Delegated to the application's idempotent seedStore(), which uses the
    // repository layer. This pre-populates the DB so the admin console has
    // content on first login.
    console.log("\nPhase 2 — Demo content (via seedStore):");
    await seedStore();
    console.log("  ✓ Demo content seeded");

    console.log("\n✅ Seed complete.");
}

main()
    .catch((err) => {
        console.error("\n❌ Seed failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
