/**
 * Prisma client singleton — the single database entry point.
 *
 * Next.js dev mode hot-reloads route modules on every save. If each module
 * created its own `new PrismaClient()`, the connection pool would be exhausted
 * within minutes (one pool per reload × every route file). The fix is the
 * standard Prisma + Next.js pattern: stash the client on `globalThis` and
 * reuse it across reloads.
 *
 * Connection pooling is handled by Prisma's internal pool (driven by the
 * `connection_limit` / `pool_timeout` query params in `DATABASE_URL`). For
 * serverless, set `?connection_limit=1` per-instance to avoid over-subscribing
 * the DB. The `log` array is wired to Pino (see `logger.ts`) so query warnings
 * and errors flow into the structured log stream.
 *
 * Server-only: this module must never be imported by client code. It is
 * imported transitively by every route handler and server component that
 * touches the database.
 *
 * @see docs/backend/database.md — connection pooling, query performance, N+1.
 */

import { PrismaClient } from "@prisma/client";

import { logger } from "@backend/logging/logger";

/** Prisma log levels we forward to Pino. */
const logLevels = ["query", "error", "warn"] as const;

// Prevent hot-reload from creating a new client on every save in dev.
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

/**
 * The shared Prisma client. Created once per process (or once per dev
 * hot-reload cycle, via the global cache).
 */
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development" ? [...logLevels] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Graceful shutdown — close the connection pool on process exit so the DB
 * isn't left with dangling connections. Important for `next build` (which
 * spins up the app to collect page data) and for `next start` under a
 * process manager (PM2, systemd) that sends SIGTERM.
 */
if (process.env.NODE_ENV !== "production") {
    // Wire Prisma's log events into Pino so DB issues appear in the same
    // structured stream as the rest of the app.
    prisma.$on("error" as never, (e: unknown) => {
        logger.error({ prisma: true, err: e }, "Prisma error");
    });
}

/** Disconnect the client (used by graceful-shutdown hooks + tests). */
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}
