import { NextResponse } from "next/server";

import { requireApiKey } from "@backend/middlewares/api-key-auth";
import {
    getPublicAchievementStats,
    getPublicDeploymentStats,
    getPublicFleetStats,
    getPublicInfraStats,
    getPublicJournalStats,
    getPublicSkillStats,
} from "@backend/services/public-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
    const principal = await requireApiKey(req, "analytics:read");
    if (principal instanceof Response) return principal;

    const [deployments, fleet, infrastructure, skills, achievements, journal] =
        await Promise.all([
            getPublicDeploymentStats(),
            getPublicFleetStats(),
            getPublicInfraStats(),
            getPublicSkillStats(),
            getPublicAchievementStats(),
            getPublicJournalStats(),
        ]);

    return NextResponse.json(
        {
            data: {
                deployments,
                fleet,
                infrastructure,
                skills,
                achievements,
                journal,
            },
            meta: {
                version: "v1",
                generatedAt: new Date().toISOString(),
            },
        },
        {
            headers: {
                "cache-control": "private, no-store, max-age=0",
                vary: "Authorization",
            },
        },
    );
}
