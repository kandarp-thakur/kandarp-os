/**
 * Dashboard page — the admin landing screen.
 *
 * Server component that fetches aggregate stats from the dashboard API
 * (or directly from the repo) and renders: stat cards, recent activity,
 * latest content, and system status.
 */

import Link from "next/link";
import {
    Activity,
    ArrowRight,
    FileText,
    FolderKanban,
    HardDrive,
    type LucideIcon,
    TrendingUp,
    Users,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { count, list } from "@/lib/admin/repo";
import { recentActivity } from "@/lib/admin/session";
import type { BlogPost, Project } from "@/lib/admin/types";

export default function DashboardPage() {
    const projects = list<Project>("projects");
    const blogPosts = list<BlogPost>("blogPosts");

    const publishedProjects = projects.filter(
        (p) => p.status === "published",
    ).length;
    const draftProjects = projects.filter((p) => p.status === "draft").length;
    const publishedPosts = blogPosts.filter(
        (p) => p.status === "published",
    ).length;
    const draftPosts = blogPosts.filter((p) => p.status === "draft").length;

    const latestProjects = [...projects]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5);

    const latestPosts = [...blogPosts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5);

    const activity = recentActivity(8);

    const stats: {
        label: string;
        value: number;
        icon: LucideIcon;
        href: string;
        tint: string;
    }[] = [
        {
            label: "Projects",
            value: projects.length,
            icon: FolderKanban,
            href: "/admin/projects",
            tint: "text-[var(--info)]",
        },
        {
            label: "Blog Posts",
            value: blogPosts.length,
            icon: FileText,
            href: "/admin/blog",
            tint: "text-[var(--success)]",
        },
        {
            label: "Users",
            value: count("users"),
            icon: Users,
            href: "/admin/users",
            tint: "text-[var(--warning)]",
        },
        {
            label: "Media Assets",
            value: count("media"),
            icon: HardDrive,
            href: "/admin/media",
            tint: "text-[var(--accent-solid)]",
        },
    ];

    return (
        <>
            <AdminPageHeader
                title="Dashboard"
                description="Overview of your content, activity, and system status."
            />

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="admin-glass group rounded-xl p-5 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <Icon className={`h-5 w-5 ${stat.tint}`} />
                                <ArrowRight className="h-4 w-4 text-[var(--text-quaternary)] opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
                                {stat.value}
                            </p>
                            <p className="text-sm text-[var(--text-tertiary)]">
                                {stat.label}
                            </p>
                        </Link>
                    );
                })}
            </div>

            {/* Content status + Quick stats */}
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="admin-glass rounded-xl p-5 lg:col-span-2">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <TrendingUp className="h-4 w-4 text-[var(--accent-solid)]" />
                        Content Status
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-[var(--canvas-sunken)] p-3">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Published Projects
                            </p>
                            <p className="mt-1 text-xl font-bold text-[var(--success)]">
                                {publishedProjects}
                            </p>
                        </div>
                        <div className="rounded-lg bg-[var(--canvas-sunken)] p-3">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Draft Projects
                            </p>
                            <p className="mt-1 text-xl font-bold text-[var(--warning)]">
                                {draftProjects}
                            </p>
                        </div>
                        <div className="rounded-lg bg-[var(--canvas-sunken)] p-3">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Published Posts
                            </p>
                            <p className="mt-1 text-xl font-bold text-[var(--success)]">
                                {publishedPosts}
                            </p>
                        </div>
                        <div className="rounded-lg bg-[var(--canvas-sunken)] p-3">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Draft Posts
                            </p>
                            <p className="mt-1 text-xl font-bold text-[var(--warning)]">
                                {draftPosts}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="admin-glass rounded-xl p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <HardDrive className="h-4 w-4 text-[var(--accent-solid)]" />
                        System Status
                    </h2>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-tertiary)]">
                                Environment
                            </span>
                            <span className="font-medium capitalize text-[var(--text-primary)]">
                                {process.env.NODE_ENV ?? "development"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-tertiary)]">
                                Memory
                            </span>
                            <span className="font-medium text-[var(--text-primary)]">
                                {Math.round(
                                    process.memoryUsage().rss / 1024 / 1024,
                                )}{" "}
                                MB
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-tertiary)]">
                                Uptime
                            </span>
                            <span className="font-medium text-[var(--text-primary)]">
                                {Math.round(process.uptime() / 60)} min
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-tertiary)]">
                                Status
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-[var(--success)]">
                                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                                Operational
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest content + Recent activity */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Latest projects */}
                <div className="admin-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Latest Projects
                        </h2>
                        <Link
                            href="/admin/projects"
                            className="text-xs text-[var(--accent-solid)] hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    {latestProjects.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                            No projects yet.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {latestProjects.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        href={`/admin/projects/${p.id}`}
                                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--overlay-hover)]"
                                    >
                                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                                            {p.title}
                                        </span>
                                        <span
                                            className={`ml-2 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${
                                                p.status === "published"
                                                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                                                    : "bg-[var(--warning)]/10 text-[var(--warning)]"
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Latest posts */}
                <div className="admin-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Latest Blog Posts
                        </h2>
                        <Link
                            href="/admin/blog"
                            className="text-xs text-[var(--accent-solid)] hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    {latestPosts.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                            No blog posts yet.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {latestPosts.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        href={`/admin/blog/${p.id}`}
                                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--overlay-hover)]"
                                    >
                                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                                            {p.title}
                                        </span>
                                        <span
                                            className={`ml-2 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${
                                                p.status === "published"
                                                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                                                    : "bg-[var(--warning)]/10 text-[var(--warning)]"
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent activity */}
                <div className="admin-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Activity className="h-4 w-4 text-[var(--accent-solid)]" />
                            Recent Activity
                        </h2>
                        <Link
                            href="/admin/activity-logs"
                            className="text-xs text-[var(--accent-solid)] hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    {activity.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                            No activity yet.
                        </p>
                    ) : (
                        <ul className="space-y-2.5">
                            {activity.map((log) => (
                                <li
                                    key={log.id}
                                    className="flex items-start gap-3"
                                >
                                    <div
                                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                            log.level === "error"
                                                ? "bg-[var(--error)]"
                                                : log.level === "warning"
                                                  ? "bg-[var(--warning)]"
                                                  : log.level === "success"
                                                    ? "bg-[var(--success)]"
                                                    : "bg-[var(--text-quaternary)]"
                                        }`}
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm text-[var(--text-primary)]">
                                            <span className="font-medium">
                                                {log.userName}
                                            </span>{" "}
                                            <span className="text-[var(--text-tertiary)]">
                                                {log.action}
                                            </span>
                                        </p>
                                        <p className="text-xs text-[var(--text-quaternary)]">
                                            {new Date(
                                                log.timestamp,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
