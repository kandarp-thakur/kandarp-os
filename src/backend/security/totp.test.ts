import assert from "node:assert/strict";
import test from "node:test";

import { verifyTotp } from "./totp";

// RFC 6238 Appendix B secret "12345678901234567890" encoded as Base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("verifyTotp accepts RFC 6238 SHA-1 vectors truncated to six digits", () => {
    const vectors = [
        { seconds: 59, code: "287082" },
        { seconds: 1_111_111_109, code: "081804" },
        { seconds: 1_111_111_111, code: "050471" },
        { seconds: 1_234_567_890, code: "005924" },
        { seconds: 2_000_000_000, code: "279037" },
        { seconds: 20_000_000_000, code: "353130" },
    ];

    for (const vector of vectors) {
        assert.equal(
            verifyTotp(RFC_SECRET, vector.code, vector.seconds * 1000),
            true,
        );
    }
});

test("verifyTotp accepts one adjacent time step for clock skew", () => {
    assert.equal(verifyTotp(RFC_SECRET, "287082", 89_000), true);
});

test("verifyTotp rejects malformed and incorrect codes", () => {
    assert.equal(verifyTotp(RFC_SECRET, "12345", 59_000), false);
    assert.equal(verifyTotp(RFC_SECRET, "abcdef", 59_000), false);
    assert.equal(verifyTotp(RFC_SECRET, "000000", 59_000), false);
});
