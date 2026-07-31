import { createHmac, randomBytes } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(value: string): Buffer {
    const normalized = value.toUpperCase().replace(/=+$/, "");
    let bits = "";
    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index < 0) throw new Error("Invalid TOTP secret");
        bits += index.toString(2).padStart(5, "0");
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
}

export function createTotpSecret(): string {
    const bytes = randomBytes(20);
    let value = "";
    let buffer = 0;
    let bits = 0;
    for (const byte of bytes) {
        buffer = (buffer << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            value += BASE32_ALPHABET[(buffer >> bits) & 31];
        }
    }
    if (bits > 0) value += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
    return value;
}

export function createTotpUri(
    secret: string,
    email: string,
    issuer = "Kandarp OS",
): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(
    secret: string,
    code: string,
    timestamp = Date.now(),
): boolean {
    const normalizedCode = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) return false;
    const counter = Math.floor(timestamp / 1000 / 30);
    const key = decodeBase32(secret);
    for (let offset = -1; offset <= 1; offset += 1) {
        const data = Buffer.alloc(8);
        data.writeBigInt64BE(BigInt(counter + offset));
        const digest = createHmac("sha1", key).update(data).digest();
        const position = (digest[digest.length - 1] ?? 0) & 0x0f;
        const byte0 = digest[position] ?? 0;
        const byte1 = digest[position + 1] ?? 0;
        const byte2 = digest[position + 2] ?? 0;
        const byte3 = digest[position + 3] ?? 0;
        const value =
            ((byte0 & 0x7f) << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
        if (String(value % 1_000_000).padStart(6, "0") === normalizedCode) {
            return true;
        }
    }
    return false;
}
