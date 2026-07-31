import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { ApiKey } from "@prisma/client";

import { prisma } from "@backend/database/db";
import type {
    ApiKeyScope,
    CreateApiKeyInput,
    UpdateApiKeyInput,
} from "@backend/schemas/api-keys";

const KEY_PREFIX = "kos_";
const SECRET_BYTES = 32;

export interface ApiKeyMetadata {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    enabled: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: { id: string; name: string; email: string };
}

export interface ApiKeyPrincipal {
    keyId: string;
    userId: string;
    scopes: ApiKeyScope[];
}

function hashSecret(secret: string): string {
    return createHash("sha256").update(secret, "utf8").digest("hex");
}

function hashesEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (
        leftBuffer.length === rightBuffer.length &&
        timingSafeEqual(leftBuffer, rightBuffer)
    );
}

function toMetadata(
    key: ApiKey & {
        createdBy: { id: string; name: string; email: string };
    },
): ApiKeyMetadata {
    return {
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        enabled: key.enabled,
        expiresAt: key.expiresAt?.toISOString() ?? null,
        lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
        revokedAt: key.revokedAt?.toISOString() ?? null,
        createdAt: key.createdAt.toISOString(),
        updatedAt: key.updatedAt.toISOString(),
        createdBy: key.createdBy,
    };
}

const includeCreator = {
    createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function listApiKeys(): Promise<ApiKeyMetadata[]> {
    const keys = await prisma.apiKey.findMany({
        include: includeCreator,
        orderBy: { createdAt: "desc" },
    });
    return keys.map(toMetadata);
}

export async function createApiKey(
    input: CreateApiKeyInput,
    createdById: string,
): Promise<{ apiKey: ApiKeyMetadata; secret: string }> {
    const secret = `${KEY_PREFIX}${randomBytes(SECRET_BYTES).toString("base64url")}`;
    const key = await prisma.apiKey.create({
        data: {
            name: input.name,
            prefix: secret.slice(0, 12),
            secretHash: hashSecret(secret),
            scopes: input.scopes,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            createdById,
        },
        include: includeCreator,
    });
    return { apiKey: toMetadata(key), secret };
}

export async function updateApiKey(
    id: string,
    input: UpdateApiKeyInput,
): Promise<ApiKeyMetadata | null> {
    const exists = await prisma.apiKey.findUnique({
        where: { id },
        select: { id: true, revokedAt: true },
    });
    if (!exists || exists.revokedAt) return null;

    const key = await prisma.apiKey.update({
        where: { id },
        data: {
            name: input.name,
            scopes: input.scopes,
            enabled: input.enabled,
            expiresAt:
                input.expiresAt === undefined
                    ? undefined
                    : input.expiresAt
                      ? new Date(input.expiresAt)
                      : null,
        },
        include: includeCreator,
    });
    return toMetadata(key);
}

export async function revokeApiKey(id: string): Promise<ApiKeyMetadata | null> {
    const exists = await prisma.apiKey.findUnique({
        where: { id },
        select: { id: true, revokedAt: true },
    });
    if (!exists || exists.revokedAt) return null;

    const key = await prisma.apiKey.update({
        where: { id },
        data: { enabled: false, revokedAt: new Date() },
        include: includeCreator,
    });
    return toMetadata(key);
}

export async function authenticateApiKey(
    secret: string,
    requiredScope?: ApiKeyScope,
): Promise<ApiKeyPrincipal | null> {
    if (!secret.startsWith(KEY_PREFIX) || secret.length < 32) return null;

    const candidateHash = hashSecret(secret);
    const key = await prisma.apiKey.findUnique({
        where: { secretHash: candidateHash },
        select: {
            id: true,
            secretHash: true,
            scopes: true,
            enabled: true,
            revokedAt: true,
            expiresAt: true,
            createdById: true,
            createdBy: { select: { status: true } },
        },
    });
    if (!key || !hashesEqual(candidateHash, key.secretHash)) return null;
    if (!key.enabled || key.revokedAt || key.createdBy.status !== "ACTIVE") {
        return null;
    }
    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) return null;
    if (requiredScope && !key.scopes.includes(requiredScope)) return null;

    await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
    });

    return {
        keyId: key.id,
        userId: key.createdById,
        scopes: key.scopes as ApiKeyScope[],
    };
}
