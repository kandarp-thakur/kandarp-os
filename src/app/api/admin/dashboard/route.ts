/**
 * GET /api/admin/dashboard — aggregate stats for the dashboard overview.
 *
 * Returns counts, recent activity, latest content, and system status in a
 * single payload so the dashboard page makes one round-trip.
 */

import { json, requirePermission } from "@backend/middlewares/api";
import { count, list } from "@backend/repositories/repo";
import { recentActivity } from "@backend/auth/session";
import { ensureSeeded } from "@backend/services/seed";
import type { BlogPost, Project } from "@backend/schemas/types";

export async function GET() {
    // Seed the store on first boot (idempotent — no-op after the first run).
    await ensureSeeded();

    const session = await requirePermission("content:read");
    if (session instanceof Response) return session;

    const projects = await list<Project>("projects");
    const blogPosts = await list<BlogPost>("blogPosts");

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
            experience: await count("experience"),
            skills: await count("skills"),
            infraNodes: await count("infraNodes"),
            awards: await count("awards"),
            education: await count("education"),
            certificates: await count("certificates"),
            services: await count("services"),
            media: await count("media"),
            users: await count("users"),
            categories: await count("categories"),
            tags: await count("tags"),
        },
        content: {
            publishedProjects,
            draftProjects,
            publishedPosts,
            draftPosts,
        },
        latestProjects,
        latestPosts,
        recentActivity: await recentActivity(8),
        system: {
            nodeEnv: process.env.NODE_ENV ?? "development",
            uptime: process.uptime(),
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
    });
}
