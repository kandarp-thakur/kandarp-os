import assert from "node:assert/strict";
import test from "node:test";

import {
    decryptSecret,
    encryptSecret,
    isSecretEnvelope,
    type SecretEnvelope,
} from "./managed-secret-crypto";

const KEY = "test-managed-secret-key-material-at-least-32-characters";

test("encryptSecret round-trips without storing plaintext", () => {
    const plaintext = "provider-secret-value";
    const envelope = encryptSecret(plaintext, KEY);

    assert.equal(isSecretEnvelope(envelope), true);
    assert.equal(decryptSecret(envelope, KEY), plaintext);
    assert.equal(JSON.stringify(envelope).includes(plaintext), false);
});

test("encryptSecret uses a fresh IV for every value", () => {
    const first = encryptSecret("same-value", KEY);
    const second = encryptSecret("same-value", KEY);

    assert.notEqual(first.iv, second.iv);
    assert.notEqual(first.ciphertext, second.ciphertext);
});

test("isSecretEnvelope rejects malformed input", () => {
    assert.equal(isSecretEnvelope(null), false);
    assert.equal(isSecretEnvelope({}), false);
    assert.equal(
        isSecretEnvelope({ v: 1, iv: "iv", tag: "tag", ciphertext: 42 }),
        false,
    );
});

test("decryptSecret rejects the wrong key", () => {
    const envelope = encryptSecret("sensitive", KEY);

    assert.throws(() =>
        decryptSecret(
            envelope,
            "different-managed-secret-key-material-at-least-32-characters",
        ),
    );
});

test("decryptSecret rejects modified ciphertext and authentication tags", () => {
    const envelope = encryptSecret("sensitive", KEY);
    const changedCiphertext: SecretEnvelope = {
        ...envelope,
        ciphertext: `${envelope.ciphertext.slice(0, -1)}${envelope.ciphertext.endsWith("A") ? "B" : "A"}`,
    };
    const changedTag: SecretEnvelope = {
        ...envelope,
        tag: `${envelope.tag.slice(0, -1)}${envelope.tag.endsWith("A") ? "B" : "A"}`,
    };

    assert.throws(() => decryptSecret(changedCiphertext, KEY));
    assert.throws(() => decryptSecret(changedTag, KEY));
});
