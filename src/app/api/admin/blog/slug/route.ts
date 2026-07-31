import { NextResponse } from "next/server";

import { requirePermission } from "@backend/middlewares/api";
import { prisma } from "@backend/database/db";
import { sanitizeSlug, SLUG_MAX_LENGTH } from "@packages/utils/slug";

export async function GET(req: Request) {
    const session = await requirePermission("content:read");
    if (session instanceof NextResponse) return session;

    const url = new URL(req.url);
    const slug = sanitizeSlug(url.searchParams.get("slug") ?? "");
    const excludeId = url.searchParams.get("excludeId");
    const existing = slug
        ? await prisma.blogPost.findUnique({
              where: { slug },
              select: { id: true },
          })
        : null;
    const available = !existing || existing.id === excludeId;
    let suggestion: string | undefined;
    if (!available) {
        for (let suffix = 2; suffix < 1000; suffix++) {
            const candidate = `${slug.slice(0, SLUG_MAX_LENGTH - String(suffix).length - 1)}-${suffix}`;
            const match = await prisma.blogPost.findUnique({
                where: { slug: candidate },
                select: { id: true },
            });
            if (!match) {
                suggestion = candidate;
                break;
            }
        }
    }
    return NextResponse.json({ available, slug, suggestion });
}
