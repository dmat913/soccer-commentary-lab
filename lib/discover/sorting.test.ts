import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  sortDiscoverPosts,
  sortDiscoverPostsByMostHeard,
} from "@/lib/discover/sorting";
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
    createdAt: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("sortDiscoverPosts", () => {
  it("sorts trending by recentHeardCount then heardCount then createdAt", () => {
    const posts = [
      makePost("legacy-heavy", {
        recentHeardCount: 5,
        heardCount: 500,
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
      makePost("recent-hot", {
        recentHeardCount: 12,
        heardCount: 100,
        createdAt: "2026-07-11T00:00:00.000Z",
      }),
      makePost("recent-tie-newer", {
        recentHeardCount: 12,
        heardCount: 100,
        createdAt: "2026-07-17T00:00:00.000Z",
      }),
      makePost("recent-tie-more-total", {
        recentHeardCount: 12,
        heardCount: 200,
        createdAt: "2026-07-12T00:00:00.000Z",
      }),
    ];

    assert.deepEqual(
      sortDiscoverPosts(posts, "trending").map((post) => post.id),
      ["recent-tie-more-total", "recent-tie-newer", "recent-hot", "legacy-heavy"]
    );
  });

  it("falls back to heardCount when all recentHeardCount are zero", () => {
    const posts = [
      makePost("low", { recentHeardCount: 0, heardCount: 10 }),
      makePost("high", { recentHeardCount: 0, heardCount: 40 }),
      makePost("mid", { recentHeardCount: 0, heardCount: 20 }),
    ];

    assert.deepEqual(
      sortDiscoverPosts(posts, "trending").map((post) => post.id),
      ["high", "mid", "low"]
    );
  });

  it("does not mutate the input array", () => {
    const posts = [
      makePost("a", { recentHeardCount: 1 }),
      makePost("b", { recentHeardCount: 5 }),
    ];
    const originalOrder = posts.map((post) => post.id);
    sortDiscoverPosts(posts, "trending");
    assert.deepEqual(
      posts.map((post) => post.id),
      originalOrder
    );
  });

  it("handles invalid createdAt without throwing", () => {
    const posts = [
      makePost("valid", {
        recentHeardCount: 1,
        createdAt: "2026-07-17T00:00:00.000Z",
      }),
      makePost("invalid", {
        recentHeardCount: 1,
        createdAt: "not-a-date",
      }),
    ];

    assert.doesNotThrow(() => sortDiscoverPosts(posts, "trending"));
    assert.equal(sortDiscoverPosts(posts, "trending")[0]?.id, "valid");
  });

  it("sorts popular by saveCount then heardCount then createdAt", () => {
    const posts = [
      makePost("save-low", {
        saveCount: 1,
        heardCount: 100,
        createdAt: "2026-07-17T00:00:00.000Z",
      }),
      makePost("save-high-old", {
        saveCount: 40,
        heardCount: 1,
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
      makePost("save-tie-more-heard", {
        saveCount: 40,
        heardCount: 20,
        createdAt: "2026-07-11T00:00:00.000Z",
      }),
      makePost("save-tie-newer", {
        saveCount: 40,
        heardCount: 20,
        createdAt: "2026-07-16T00:00:00.000Z",
      }),
    ];

    assert.deepEqual(
      sortDiscoverPosts(posts, "popular").map((post) => post.id),
      ["save-tie-newer", "save-tie-more-heard", "save-high-old", "save-low"]
    );
  });

  it("sorts newest by createdAt", () => {
    const posts = [
      makePost("old", { createdAt: "2026-07-15T00:00:00.000Z" }),
      makePost("new", { createdAt: "2026-07-17T00:00:00.000Z" }),
      makePost("mid", { createdAt: "2026-07-16T00:00:00.000Z" }),
    ];

    assert.deepEqual(
      sortDiscoverPosts(posts, "newest").map((post) => post.id),
      ["new", "mid", "old"]
    );
  });
});

describe("sortDiscoverPostsByMostHeard", () => {
  it("ranks by cumulative heardCount independently from recentHeardCount", () => {
    const posts = [
      makePost("recent", { recentHeardCount: 50, heardCount: 10 }),
      makePost("all-time", { recentHeardCount: 1, heardCount: 400 }),
    ];

    assert.deepEqual(
      sortDiscoverPostsByMostHeard(posts).map((post) => post.id),
      ["all-time", "recent"]
    );
    assert.deepEqual(
      sortDiscoverPosts(posts, "trending").map((post) => post.id),
      ["recent", "all-time"]
    );
  });
});
