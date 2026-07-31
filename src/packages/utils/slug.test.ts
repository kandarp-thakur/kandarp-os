import test from "node:test";
import assert from "node:assert/strict";

import { isValidSlug, sanitizeSlug } from "@packages/utils/slug";

test("sanitizes common blog titles into URL slugs", () => {
    const cases = [
        ["Hello World", "hello-world"],
        ["Hello_World", "hello-world"],
        ["Hello    World", "hello-world"],
        ["HELLO WORLD", "hello-world"],
        ["Hello@Docker!", "hello-docker"],
        ["Docker & Kubernetes", "docker-kubernetes"],
        ["React_2026", "react-2026"],
        ["New Blog About Docker", "new-blog-about-docker"],
    ] as const;

    for (const [input, expected] of cases) {
        assert.equal(sanitizeSlug(input), expected);
        assert.equal(isValidSlug(expected), true);
    }
});

test("collapses duplicate separators and removes edge separators", () => {
    assert.equal(sanitizeSlug("---My---First---Blog---"), "my-first-blog");
    assert.equal(isValidSlug("my-first-blog"), true);
});
