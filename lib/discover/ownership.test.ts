import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isOwnedDiscoverPost,
  removeDiscoverPostFromList,
  shouldConfirmUnfavoriteBecausePublished,
} from "@/lib/discover/ownership";
import { normalizeDiscoverEnglishText } from "@/lib/discover/supabase-mapping";

describe("isOwnedDiscoverPost", () => {
  it("returns true only when the post id is in the owned set", () => {
    const owned = new Set(["a", "b"]);
    assert.equal(isOwnedDiscoverPost("a", owned), true);
    assert.equal(isOwnedDiscoverPost("c", owned), false);
  });
});

describe("shouldConfirmUnfavoriteBecausePublished", () => {
  it("matches published favorites by trimmed english text", () => {
    const key = normalizeDiscoverEnglishText("  Goal!  ");
    const published = new Map([[key, { id: "post-1" }]]);

    assert.equal(
      shouldConfirmUnfavoriteBecausePublished("Goal!", published),
      true
    );
    assert.equal(
      shouldConfirmUnfavoriteBecausePublished("  Goal!  ", published),
      true
    );
    assert.equal(
      shouldConfirmUnfavoriteBecausePublished("Save!", published),
      false
    );
  });
});

describe("removeDiscoverPostFromList", () => {
  it("removes the matching post and leaves others", () => {
    const posts = [
      { id: "1", englishText: "a" },
      { id: "2", englishText: "b" },
    ];
    assert.deepEqual(removeDiscoverPostFromList(posts, "1"), [
      { id: "2", englishText: "b" },
    ]);
    assert.deepEqual(removeDiscoverPostFromList(posts, "missing"), posts);
  });
});
