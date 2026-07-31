import assert from "node:assert/strict";
import test from "node:test";

import { signSession, signTotpChallenge, verifyTotpChallenge } from "./auth";

const FIXED_NOW = 1_800_000_000_000;

test("TOTP challenge preserves the authorized subject and remember preference", () => {
    const originalNow = Date.now;
    Date.now = () => FIXED_NOW;
    try {
        const challenge = signTotpChallenge("user-123", true);
        const payload = verifyTotpChallenge(challenge);

        assert.equal(payload?.sub, "user-123");
        assert.equal(payload?.remember, true);
        assert.equal(payload?.purpose, "totp-login");
        assert.equal(payload?.exp, payload?.iat + 5 * 60);
    } finally {
        Date.now = originalNow;
    }
});

test("TOTP challenge rejects modified payloads and signatures", () => {
    const challenge = signTotpChallenge("user-123");
    const [body, signature] = challenge.split(".") as [string, string];
    const payload = JSON.parse(
        Buffer.from(body, "base64url").toString("utf8"),
    ) as Record<string, unknown>;

    payload.sub = "user-456";
    const modifiedBody = Buffer.from(JSON.stringify(payload)).toString(
        "base64url",
    );
    assert.equal(verifyTotpChallenge(`${modifiedBody}.${signature}`), null);

    const modifiedSignature = `${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`;
    assert.equal(verifyTotpChallenge(`${body}.${modifiedSignature}`), null);
});

test("TOTP challenge expires after five minutes", () => {
    const originalNow = Date.now;
    Date.now = () => FIXED_NOW;
    try {
        const challenge = signTotpChallenge("user-123");
        Date.now = () => FIXED_NOW + 5 * 60 * 1000;
        assert.equal(verifyTotpChallenge(challenge), null);
    } finally {
        Date.now = originalNow;
    }
});

test("TOTP challenge rejects tokens issued for the session purpose", () => {
    const session = signSession({
        sub: "user-123",
        sid: "session-123",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
    });

    assert.equal(verifyTotpChallenge(session), null);
});
