/**
 * Console layout — the server component that wraps every authenticated
 * admin page (everything except /admin/login).
 *
 * Resolves the current session, loads the user record (secrets stripped),
 * and passes it to the AdminShell client component. If there's no session,
 * middleware already redirected to /admin/login — but we double-check here
 * as a safety net.
 */

import { redirect } from "next/navigation";

import { AdminShell } from "@features/admin/components/AdminShell";
import { getSession } from "@backend/auth/session";
import { findById } from "@backend/repositories/repo";
import { ensureSeeded } from "@backend/services/seed";
import type { SafeUser, User } from "@backend/schemas/types";

export default async function ConsoleLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    // Seed the store on first boot (idempotent — no-op after the first run).
    await ensureSeeded();

    const session = await getSession();
    if (!session) redirect("/admin/login");

    const user = await findById<User>("users", session.sub);
    if (!user || user.status !== "active") redirect("/admin/login");

    // Strip secrets before passing to the client.
    const { passwordHash: _p, totpSecret: _t, ...safeUser } = user;

    return <AdminShell user={safeUser as SafeUser}>{children}</AdminShell>;
}
