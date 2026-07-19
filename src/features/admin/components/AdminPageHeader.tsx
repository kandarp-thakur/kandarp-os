/**
 * AdminPageHeader — the consistent title + actions bar at the top of every
 * admin page. Server component (no client interactivity needed).
 */

import type { ReactNode } from "react";

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function AdminPageHeader({
    title,
    description,
    actions,
}: AdminPageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">{actions}</div>
            )}
        </div>
    );
}
