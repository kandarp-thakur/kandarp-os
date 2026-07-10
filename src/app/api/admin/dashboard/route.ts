/**
 * GET /api/admin/dashboard — aggregate stats for the dashboard overview.
 *
 * Returns counts, recent activity, latest content, and system status in a
 * single payload so the dashboard page makes one round-trip.
 */

import { json, requirePermission } from "@/lib/admin/api";
import { count, list } from "@/lib/admin/repo";
import { recentActivity } from "@/lib/admin/session";
import { ensureSeeded } from "@/lib/admin/seed";
import type { BlogPost, Project } from "@/lib/admin/types";

export async function GET() {
    // Seed the store on first boot (idempotent — no-op after the first run).
    await ensureSeeded();

    const session = await requirePermission("content:read");
    if (session instanceof Response) return session;

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
        .slice(0, 5)
        .map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            updatedAt: p.updatedAt,
        }));

    const latestPosts = [...blogPosts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5)
        .map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            updatedAt: p.updatedAt,
        }));

    return json({
        counts: {
            projects: projects.length,
            blogPosts: blogPosts.length,
            experience: count("experience"),
            skills: count("skills"),
            infraNodes: count("infraNodes"),
            awards: count("awards"),
            education: count("education"),
            certificates: count("certificates"),
            services: count("services"),
            media: count("media"),
            users: count("users"),
            categories: count("categories"),
            tags: count("tags"),
        },
        content: {
            publishedProjects,
            draftProjects,
            publishedPosts,
            draftPosts,
        },
        latestProjects,
        latestPosts,
        recentActivity: recentActivity(8),
        system: {
            nodeEnv: process.env.NODE_ENV ?? "development",
            uptime: process.uptime(),
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
    });
}
