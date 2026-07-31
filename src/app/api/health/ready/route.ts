import { NextResponse } from "next/server";

import {
    assertProductionSecrets,
    isProduction,
} from "@backend/config/env-schema";
import { prisma } from "@backend/database/db";
import { logger } from "@backend/logging/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ReadinessPayload {
    status: "ok" | "not_ready";
    service: "kandarp-os";
    timestamp: string;
    checks: {
        configuration: "ok" | "failed";
        database: "ok" | "failed";
    };
}

/**
 * Dependency readiness probe for orchestrators and reverse proxies.
 *
 * Production secret validation is deliberately performed here so deployments
 * fail visibly at the health boundary instead of serving a partially configured
 * application. The database check is a lightweight connection test and does not
 * expose driver or connection details to the caller.
 */
export async function GET(): Promise<NextResponse<ReadinessPayload>> {
    let configuration: "ok" | "failed" = "ok";
    let database: "ok" | "failed" = "ok";

    try {
        assertProductionSecrets();
    } catch (err) {
        configuration = "failed";
        logger.error({ err }, "health.readiness.configuration_failed");
    }

    if (configuration === "ok" && isProduction) {
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (err) {
            database = "failed";
            logger.error({ err }, "health.readiness.database_failed");
        }
    }

    const ready = configuration === "ok" && database === "ok";
    const payload: ReadinessPayload = {
        status: ready ? "ok" : "not_ready",
        service: "kandarp-os",
        timestamp: new Date().toISOString(),
        checks: { configuration, database },
    };

    return NextResponse.json(payload, {
        status: ready ? 200 : 503,
        headers: {
            "cache-control": "no-store, max-age=0",
        },
    });
}
