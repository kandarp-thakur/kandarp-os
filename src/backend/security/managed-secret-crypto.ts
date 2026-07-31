import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const ENVELOPE_VERSION = 1;
const IV_BYTES = 12;

export interface SecretEnvelope {
    v: 1;
    iv: string;
    tag: string;
    ciphertext: string;
}

function encryptionKey(material: string): Buffer {
    return createHash("sha256").update(material, "utf8").digest();
}

export function isSecretEnvelope(value: unknown): value is SecretEnvelope {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    return (
        record.v === ENVELOPE_VERSION &&
        typeof record.iv === "string" &&
        typeof record.tag === "string" &&
        typeof record.ciphertext === "string"
    );
}

export function encryptSecret(
    value: string,
    keyMaterial: string,
): SecretEnvelope {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, encryptionKey(keyMaterial), iv);
    const ciphertext = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final(),
    ]);

    return {
        v: ENVELOPE_VERSION,
        iv: iv.toString("base64url"),
        tag: cipher.getAuthTag().toString("base64url"),
        ciphertext: ciphertext.toString("base64url"),
    };
}

export function decryptSecret(
    envelope: SecretEnvelope,
    keyMaterial: string,
): string {
    if (!isSecretEnvelope(envelope)) {
        throw new Error("Invalid encrypted secret envelope");
    }

    const decodeCanonical = (encoded: string): Buffer => {
        const decoded = Buffer.from(encoded, "base64url");
        if (decoded.toString("base64url") !== encoded) {
            throw new Error("Invalid encrypted secret envelope");
        }
        return decoded;
    };

    const iv = decodeCanonical(envelope.iv);
    const tag = decodeCanonical(envelope.tag);
    const ciphertext = decodeCanonical(envelope.ciphertext);
    if (
        iv.length !== IV_BYTES ||
        tag.length !== 16 ||
        ciphertext.length === 0
    ) {
        throw new Error("Invalid encrypted secret envelope");
    }

    const decipher = createDecipheriv(
        ALGORITHM,
        encryptionKey(keyMaterial),
        iv,
    );
    decipher.setAuthTag(tag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString("utf8");
}
