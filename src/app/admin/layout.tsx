/**
 * Admin root layout — thin wrapper for the entire /admin namespace.
 *
 * Imports the admin design tokens (dark theme) so they're available to
 * every admin page. The actual shell (sidebar + topbar) lives in the
 * `(console)` route group layout, so the login page stays shell-free.
 */

import "@styles/admin-tokens.css";

export default function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
