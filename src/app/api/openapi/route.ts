import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(): Promise<NextResponse> {
    const specification = await readFile(
        path.join(process.cwd(), "docs", "backend", "openapi.yaml"),
        "utf8",
    );
    return new NextResponse(specification, {
        headers: {
            "content-type": "application/yaml; charset=utf-8",
            "cache-control":
                "public, max-age=3600, stale-while-revalidate=86400",
        },
    });
}
