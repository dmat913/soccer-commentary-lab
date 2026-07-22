import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adjustDiscoverHeardCount,
  applyHeardCountDeltaToPosts,
  createHeardPostIdSet,
  isPostHeard,
  restoreHeardCountOnPosts,
  snapshotHeardToggle,
  withHeardPostId,
} from "@/lib/discover/heard-state";
import { sortDiscoverPosts } from "@/lib/discover/sorting";
import type { DiscoverPost } from "@/types/discover";

function makePost(
  id: string,
  overrides: Partial<DiscoverPost> = {}
): DiscoverPost {
  return {
    id,
    englishText: id,
    japaneseText: id,
    meaning: id,
    learningPointText: id,
    learningPointMeaning: id,
    category: "general",
    heardCount: 0,
    recentHeardCount: 0,
    saveCount: 0,
    createdAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("discover heard state helpers", () => {
  it("tracks heard post ids independently", () => {
    const heard = createHeardPostIdSet(["a"]);
    assert.equal(isPostHeard(heard, "a"), true);
    assert.equal(isPostHeard(heard, "b"), false);

    const afterAdd = withHeardPostId(heard, "b", true);
    assert.equal(isPostHeard(afterAdd, "b"), true);
    assert.equal(isPostHeard(heard, "b"), false);

    const afterRemove = withHeardPostId(afterAdd, "a", false);
    assert.equal(isPostHeard(afterRemove, "a"), false);
    assert.equal(isPostHeard(afterRemove, "b"), true);
  });

  it("increments and decrements heard counts without going below zero", () => {
    assert.equal(adjustDiscoverHeardCount(10, 1), 11);
    assert.equal(adjustDiscoverHeardCount(1, -1), 0);
    assert.equal(adjustDiscoverHeardCount(0, -1), 0);
  });

  it("applies session hear to both heardCount and recentHeardCount", () => {
    const posts = [
      makePost("a", { heardCount: 5, recentHeardCount: 2, saveCount: 9 }),
      makePost("b", { heardCount: 2, recentHeardCount: 1, saveCount: 4 }),
    ];

    const incremented = applyHeardCountDeltaToPosts(posts, "a", 1);
    assert.equal(incremented[0]?.heardCount, 6);
    assert.equal(incremented[0]?.recentHeardCount, 3);
    assert.equal(incremented[0]?.saveCount, 9);
    assert.equal(incremented[1]?.heardCount, 2);

    const snapshot = snapshotHeardToggle(
      createHeardPostIdSet([]),
      posts,
      "a"
    );
    assert.deepEqual(snapshot, {
      wasHeard: false,
      previousHeardCount: 5,
      previousRecentHeardCount: 2,
    });

    const restored = restoreHeardCountOnPosts(incremented, "a", 5, 2);
    assert.equal(restored[0]?.heardCount, 5);
    assert.equal(restored[0]?.recentHeardCount, 2);
  });

  it("can adjust heardCount without changing recentHeardCount", () => {
    const posts = [makePost("a", { heardCount: 8, recentHeardCount: 3 })];
    const updated = applyHeardCountDeltaToPosts(posts, "a", -1, {
      adjustRecent: false,
    });
    assert.equal(updated[0]?.heardCount, 7);
    assert.equal(updated[0]?.recentHeardCount, 3);
  });

  it("keeps popular sort on saveCount after heardCount changes", () => {
    const posts = [
      makePost("heard-heavy", {
        heardCount: 100,
        recentHeardCount: 10,
        saveCount: 1,
      }),
      makePost("save-heavy", {
        heardCount: 1,
        recentHeardCount: 0,
        saveCount: 50,
      }),
    ];

    const afterHeard = applyHeardCountDeltaToPosts(posts, "heard-heavy", 1);
    assert.deepEqual(
      sortDiscoverPosts(afterHeard, "trending").map((post) => post.id),
      ["heard-heavy", "save-heavy"]
    );
    assert.deepEqual(
      sortDiscoverPosts(afterHeard, "popular").map((post) => post.id),
      ["save-heavy", "heard-heavy"]
    );
  });
});
