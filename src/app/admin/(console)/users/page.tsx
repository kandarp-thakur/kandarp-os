"use client";

/**
 * Users management page — list users + create/delete with role assignment.
 *
 * Shows all users (secrets stripped) in a table with role + status badges.
 * Create modal supports name, email, password, role, and status.
 */

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    AdminDataTable,
    type AdminColumn,
} from "@/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { ROLE_LABELS } from "@/lib/admin/rbac";
import type { SafeUser } from "@/lib/admin/types";

const columns: AdminColumn<SafeUser>[] = [
    {
        key: "name",
        label: "Name",
        sortable: true,
        render: (u) => (
            <span className="font-medium text-[var(--text-primary)]">
                {u.name}
            </span>
        ),
    },
    { key: "email", label: "Email", sortable: true, render: (u) => u.email },
    {
        key: "role",
        label: "Role",
        sortable: true,
        render: (u) => (
            <span className="rounded-md bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--accent-solid)]">
                {ROLE_LABELS[u.role]}
            </span>
        ),
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (u) => <AdminStatusBadge status={u.status} />,
    },
    {
        key: "lastLoginAt",
        label: "Last Login",
        render: (u) =>
            u.lastLoginAt
                ? new Date(u.lastLoginAt).toLocaleDateString()
                : "Never",
    },
];

export default function AdminUsersPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "viewer",
        status: "active",
    });

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to create user.");
                setSaving(false);
                return;
            }
            setShowCreate(false);
            setForm({
                name: "",
                email: "",
                password: "",
                role: "viewer",
                status: "active",
            });
            setRefreshKey((k) => k + 1);
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this user?")) return;
        await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        setRefreshKey((k) => k + 1);
    };

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";
    const labelClass =
        "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <>
            <AdminPageHeader
                title="Users"
                description="Manage admin users and their roles."
                actions={
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </button>
                }
            />

            <div key={refreshKey}>
                <AdminDataTable<SafeUser>
                    columns={[
                        ...columns,
                        {
                            key: "_actions",
                            label: "",
                            render: (u) => (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(u.id);
                                    }}
                                    className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            ),
                        },
                    ]}
                    fetchUrl="/api/admin/users"
                    rowKey={(u) => u.id}
                    emptyMessage="No users yet."
                />
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                Add User
                            </h2>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {error && (
                            <div className="mx-6 mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-2.5 text-sm text-[var(--error)]">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4 p-6">
                            <div>
                                <label className={labelClass}>Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                    required
                                    minLength={8}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            role: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            status: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="invited">Invited</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {saving ? "Creating…" : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
