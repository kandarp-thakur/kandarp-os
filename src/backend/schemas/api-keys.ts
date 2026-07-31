import { z } from "zod";

export const API_KEY_SCOPES = ["content:read", "analytics:read"] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const apiKeyScopeSchema = z.enum(API_KEY_SCOPES);

export const createApiKeySchema = z.object({
    name: z.string().trim().min(2).max(80),
    scopes: z.array(apiKeyScopeSchema).min(1).max(API_KEY_SCOPES.length),
    expiresAt: z
        .string()
        .datetime({ offset: true })
        .nullable()
        .optional()
        .refine(
            (value) =>
                value === undefined ||
                value === null ||
                new Date(value).getTime() > Date.now(),
            "Expiry must be in the future",
        ),
});

export const updateApiKeySchema = z
    .object({
        name: z.string().trim().min(2).max(80).optional(),
        scopes: z
            .array(apiKeyScopeSchema)
            .min(1)
            .max(API_KEY_SCOPES.length)
            .optional(),
        enabled: z.boolean().optional(),
        expiresAt: z
            .string()
            .datetime({ offset: true })
            .nullable()
            .optional()
            .refine(
                (value) =>
                    value === undefined ||
                    value === null ||
                    new Date(value).getTime() > Date.now(),
                "Expiry must be in the future",
            ),
    })
    .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
