import { z } from "zod";

const identifier = z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(
        /^[A-Za-z0-9_.:-]+$/,
        "Use letters, numbers, dot, underscore, colon, or dash",
    );

export const secretFieldInputSchema = z.object({
    key: identifier,
    value: z.string().min(1).max(16_384).optional(),
});

export const integrationInputSchema = z.object({
    id: identifier,
    name: z.string().trim().min(1).max(120),
    enabled: z.boolean(),
    config: z.array(secretFieldInputSchema).max(100),
});

export const replaceIntegrationsSchema = z.object({
    integrations: z.array(integrationInputSchema).max(100),
});

export const environmentVariableInputSchema = z.object({
    id: identifier,
    key: z
        .string()
        .trim()
        .min(1)
        .max(128)
        .regex(
            /^[A-Z_][A-Z0-9_]*$/,
            "Use an uppercase environment variable name",
        ),
    value: z.string().min(1).max(16_384).optional(),
    description: z.string().trim().max(500),
});

export const replaceEnvironmentVariablesSchema = z.object({
    environmentVariables: z.array(environmentVariableInputSchema).max(200),
});

export type IntegrationInput = z.infer<typeof integrationInputSchema>;
export type EnvironmentVariableInput = z.infer<
    typeof environmentVariableInputSchema
>;

export interface SecretFieldMetadata {
    key: string;
    configured: boolean;
}

export interface IntegrationMetadata {
    id: string;
    name: string;
    enabled: boolean;
    config: SecretFieldMetadata[];
}

export interface EnvironmentVariableMetadata {
    id: string;
    key: string;
    description: string;
    configured: boolean;
}
