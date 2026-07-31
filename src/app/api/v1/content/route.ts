import { NextResponse } from "next/server";

import { requireApiKey } from "@backend/middlewares/api-key-auth";
import {
    getPublicAwards,
    getPublicBlogPosts,
    getPublicCertificates,
    getPublicEducation,
    getPublicExperience,
    getPublicInfraEdges,
    getPublicInfraNodes,
    getPublicProjects,
    getPublicResumes,
    getPublicServices,
    getPublicSkills,
} from "@backend/services/public-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
    const principal = await requireApiKey(req, "content:read");
    if (principal instanceof Response) return principal;

    const [
        projects,
        posts,
        experience,
        skills,
        infrastructureNodes,
        infrastructureEdges,
        awards,
        education,
        certificates,
        services,
        resumes,
    ] = await Promise.all([
        getPublicProjects(),
        getPublicBlogPosts(),
        getPublicExperience(),
        getPublicSkills(),
        getPublicInfraNodes(),
        getPublicInfraEdges(),
        getPublicAwards(),
        getPublicEducation(),
        getPublicCertificates(),
        getPublicServices(),
        getPublicResumes(),
    ]);

    return NextResponse.json(
        {
            data: {
                projects,
                posts,
                experience,
                skills,
                infrastructure: {
                    nodes: infrastructureNodes,
                    edges: infrastructureEdges,
                },
                awards,
                education,
                certificates,
                services,
                resumes,
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
