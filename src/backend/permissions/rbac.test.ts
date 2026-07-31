import assert from "node:assert/strict";
import test from "node:test";

import { canWithOverride } from "./rbac";

test("explicit grant overrides a role denial", () => {
    assert.equal(canWithOverride("viewer", "content:write", true), true);
});

test("explicit denial overrides a role grant", () => {
    assert.equal(canWithOverride("owner", "owner:super", false), false);
});

test("missing override falls back to the role permission matrix", () => {
    assert.equal(canWithOverride("viewer", "content:read", undefined), true);
    assert.equal(canWithOverride("viewer", "content:write", undefined), false);
    assert.equal(canWithOverride("editor", "content:write", null), true);
});
