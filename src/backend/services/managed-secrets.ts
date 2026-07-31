import type { Prisma } from "@prisma/client";

import { env, isProduction } from "@backend/config/env-schema";
import { prisma } from "@backend/database/db";
import type {
    EnvironmentVariableInput,
    EnvironmentVariableMetadata,
    IntegrationInput,
    IntegrationMetadata,
} from "@backend/schemas/managed-secrets";
import {
    decryptSecret,
    encryptSecret,
    isSecretEnvelope,
    type SecretEnvelope,
} from "@backend/security/managed-secret-crypto";

interface StoredIntegration {
    id: string;
    name: string;
    enabled: boolean;
    config: Record<string, SecretEnvelope>;
}

interface StoredEnvironmentVariable {
    id: string;
    key: string;
    description: string;
    value?: SecretEnvelope;
}

function keyMaterial(): string {
    const material =
        env.MANAGED_SECRETS_KEY ??
        (!isProduction
            ? (env.AUTH_SECRET ??
              env.ADMIN_JWT_SECRET ??
              "kandarp-os-development-managed-secrets-key")
            : undefined);
    if (!material) {
        throw new Error("Managed-secret encryption key is not configured");
    }
    return material;
}

/** Server-only runtime accessor. Administrative APIs must never call this. */
export function decryptManagedSecret(envelope: unknown): string | null {
    if (!isSecretEnvelope(envelope)) return null;
    return decryptSecret(envelope, keyMaterial());
}

function parseIntegrations(value: Prisma.JsonValue): StoredIntegration[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const row = item as Record<string, unknown>;
        if (
            typeof row.id !== "string" ||
            typeof row.name !== "string" ||
            typeof row.enabled !== "boolean"
        ) {
            return [];
        }
        const config: Record<string, SecretEnvelope> = {};
        if (
            row.config &&
            typeof row.config === "object" &&
            !Array.isArray(row.config)
        ) {
            for (const [key, secret] of Object.entries(row.config)) {
                if (isSecretEnvelope(secret)) config[key] = secret;
            }
        }
        return [{ id: row.id, name: row.name, enabled: row.enabled, config }];
    });
}

function parseEnvironmentVariables(
    value: Prisma.JsonValue,
): StoredEnvironmentVariable[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const row = item as Record<string, unknown>;
        if (typeof row.id !== "string" || typeof row.key !== "string")
            return [];
        return [
            {
                id: row.id,
                key: row.key,
                description:
                    typeof row.description === "string" ? row.description : "",
                value: isSecretEnvelope(row.value) ? row.value : undefined,
            },
        ];
    });
}

async function settingsSecrets(): Promise<{
    id: string;
    integrations: StoredIntegration[];
    environmentVariables: StoredEnvironmentVariable[];
}> {
    const row = await prisma.settings.findFirst({
        select: { id: true, integrations: true, environmentVariables: true },
    });
    if (!row) throw new Error("Settings not initialized");
    return {
        id: row.id,
        integrations: parseIntegrations(row.integrations),
        environmentVariables: parseEnvironmentVariables(
            row.environmentVariables,
        ),
    };
}

function integrationMetadata(row: StoredIntegration): IntegrationMetadata {
    return {
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        config: Object.keys(row.config)
            .sort()
            .map((key) => ({ key, configured: true })),
    };
}

function environmentMetadata(
    row: StoredEnvironmentVariable,
): EnvironmentVariableMetadata {
    return {
        id: row.id,
        key: row.key,
        description: row.description,
        configured: Boolean(row.value),
    };
}

export async function listIntegrations(): Promise<IntegrationMetadata[]> {
    const settings = await settingsSecrets();
    return settings.integrations.map(integrationMetadata);
}

export async function replaceIntegrations(
    input: IntegrationInput[],
): Promise<IntegrationMetadata[]> {
    const settings = await settingsSecrets();
    const existing = new Map(settings.integrations.map((row) => [row.id, row]));
    const stored: StoredIntegration[] = input.map((item) => {
        const previous = existing.get(item.id);
        const config: Record<string, SecretEnvelope> = {};
        for (const field of item.config) {
            const next =
                field.value === undefined
                    ? previous?.config[field.key]
                    : encryptSecret(field.value, keyMaterial());
            if (next) config[field.key] = next;
        }
        return { id: item.id, name: item.name, enabled: item.enabled, config };
    });
    await prisma.settings.update({
        where: { id: settings.id },
        data: { integrations: stored as unknown as Prisma.InputJsonValue },
    });
    return stored.map(integrationMetadata);
}

export async function listEnvironmentVariables(): Promise<
    EnvironmentVariableMetadata[]
> {
    const settings = await settingsSecrets();
    return settings.environmentVariables.map(environmentMetadata);
}

export async function replaceEnvironmentVariables(
    input: EnvironmentVariableInput[],
): Promise<EnvironmentVariableMetadata[]> {
    const settings = await settingsSecrets();
    const existing = new Map(
        settings.environmentVariables.map((row) => [row.id, row]),
    );
    const stored: StoredEnvironmentVariable[] = input.map((item) => {
        const previous = existing.get(item.id);
        return {
            id: item.id,
            key: item.key,
            description: item.description,
            value:
                item.value === undefined
                    ? previous?.value
                    : encryptSecret(item.value, keyMaterial()),
        };
    });
    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            environmentVariables: stored as unknown as Prisma.InputJsonValue,
        },
    });
    return stored.map(environmentMetadata);
}
