"use client";

/**
 * Roles & Permissions page — the RBAC matrix + per-user role assignment.
 *
 * Renders the role → permission matrix from the rbac module (read-only —
 * the matrix is code-defined, not data-driven) and a list of all users
 * with their current role, allowing admins/owners to change a user's
 * role inline via /api/admin/users/[id].
 */

import { Fragment, useCallback, useEffect, useState } from "react";
import { Check, Loader2, Minus, ShieldCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    ROLES,
    ROLE_DESCRIPTIONS,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    type Permission,
} from "@/lib/admin/rbac";
import type { AdminRole } from "@/lib/admin/auth";
import type { SafeUser } from "@/lib/admin/types";

/** All permissions in display order (derived from the matrix). */
const ALL_PERMISSIONS: Permission[] = Array.from(
    new Set(ROLES.flatMap((r) => ROLE_PERMISSIONS[r])),
);

/** Group permissions by category for the matrix. */
const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
    {
        label: "Content",
        perms: ALL_PERMISSIONS.filter((p) => p.startsWith("content:")),
    },
    {
        label: "Media",
        perms: ALL_PERMISSIONS.filter((p) => p.startsWith("media:")),
    },
    {
        label: "Settings & SEO",
        perms: ALL_PERMISSIONS.filter((p) => p.startsWith("settings:")),
    },
    {
        label: "Analytics & Audit",
        perms: ALL_PERMISSIONS.filter(
            (p) => p.startsWith("analytics:") || p.startsWith("audit:"),
        ),
    },
    {
        label: "Users & RBAC",
        perms: ALL_PERMISSIONS.filter((p) => p.startsWith("users:")),
    },
    {
        label: "Backup & Owner",
        perms: ALL_PERMISSIONS.filter(
            (p) => p.startsWith("backup:") || p.startsWith("owner:"),
        ),
    },
];

export default function AdminRolesPage() {
    const [users, setUsers] = useState<SafeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users?pageSize=200");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.rows ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: string, role: AdminRole) => {
        setSavingId(userId);
        setError(null);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to update role.");
            } else {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, role } : u)),
                );
            }
        } catch {
            setError("Network error.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Roles & Permissions"
                description="The authorization matrix and per-user role assignment."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            {/* ── Role cards ─────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ROLES.map((role) => (
                    <div
                        key={role}
                        className="admin-glass rounded-xl p-5"
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[var(--accent-solid)]" />
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                {ROLE_LABELS[role]}
                            </h3>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {ROLE_DESCRIPTIONS[role]}
                        </p>
                        <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
                            {ROLE_PERMISSIONS[role].length} permissions
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Permission matrix ──────────────────────────────────────── */}
            <div className="admin-glass mb-6 overflow-x-auto rounded-xl p-5">
                <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                    Permission Matrix
                </h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-left">
                            <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                Permission
                            </th>
                            {ROLES.map((role) => (
                                <th
                                    key={role}
                                    className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]"
                                >
                                    {ROLE_LABELS[role]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PERMISSION_GROUPS.map((group) => (
                            <Fragment key={group.label}>
                                <tr className="border-b border-[var(--border-subtle)] bg-[var(--canvas-sunken)]">
                                    <td
                                        colSpan={ROLES.length + 1}
                                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                                    >
                                        {group.label}
                                    </td>
                                </tr>
                                {group.perms.map((perm) => (
                                    <tr
                                        key={perm}
                                        className="border-b border-[var(--border-subtle)]"
                                    >
                                        <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
                                            {perm}
                                        </td>
                                        {ROLES.map((role) => {
                                            const granted =
                                                ROLE_PERMISSIONS[role].includes(
                                                    perm,
                                                );
                                            return (
                                                <td
                                                    key={role}
                                                    className="px-3 py-2 text-center"
                                                >
                                                    {granted ? (
                                                        <Check className="mx-auto h-4 w-4 text-[var(--success)]" />
                                                    ) : (
                                                        <Minus className="mx-auto h-4 w-4 text-[var(--text-quaternary)]" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── User role assignment ───────────────────────────────────── */}
            <div className="admin-glass overflow-hidden rounded-xl">
                <div className="border-b border-[var(--border-subtle)] px-5 py-4">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                        User Role Assignment
                    </h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)] text-left text-xs uppercase tracking-wider text-[var(--text-quaternary)]">
                                <th className="px-5 py-3 font-medium">Name</th>
                                <th className="px-5 py-3 font-medium">
                                    Email
                                </th>
                                <th className="px-5 py-3 font-medium">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                                        {u.name}
                                    </td>
                                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                                        {u.email}
                                    </td>
                                    <td className="px-5 py-3">
                                        <select
                                            value={u.role}
                                            disabled={savingId === u.id}
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    u.id,
                                                    e.target.value as AdminRole,
                                                )
                                            }
                                            className="rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)] disabled:opacity-60"
                                        >
                                            {ROLES.map((role) => (
                                                <option
                                                    key={role}
                                                    value={role}
                                                >
                                                    {ROLE_LABELS[role]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
