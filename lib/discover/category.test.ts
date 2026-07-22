import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterDiscoverFeedPosts,
  inferDiscoverCategory,
  parseDiscoverCategory,
} from "@/lib/discover/category";
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

describe("inferDiscoverCategory", () => {
  it("classifies common English commentary phrases", () => {
    assert.equal(
      inferDiscoverCategory({ englishText: "What a finish!" }),
      "goal"
    );
    assert.equal(
      inferDiscoverCategory({ englishText: "He fires a shot" }),
      "shot"
    );
    assert.equal(
      inferDiscoverCategory({
        englishText: "What a brilliant through ball",
      }),
      "pass"
    );
    assert.equal(
      inferDiscoverCategory({ englishText: "He beats his man" }),
      "dribble"
    );
    assert.equal(
      inferDiscoverCategory({ englishText: "What a save!" }),
      "save"
    );
    assert.equal(
      inferDiscoverCategory({
        englishText: "A perfectly timed tackle",
      }),
      "defending"
    );
    assert.equal(
      inferDiscoverCategory({
        englishText: "He steps up for the penalty",
      }),
      "set-piece"
    );
    assert.equal(
      inferDiscoverCategory({ englishText: "The atmosphere is electric" }),
      "general"
    );
  });

  it("prefers save over shot and goal over shot", () => {
    assert.equal(
      inferDiscoverCategory({
        englishText: "What a save to deny the shot",
      }),
      "save"
    );
    assert.equal(
      inferDiscoverCategory({
        englishText: "He scores with a brilliant shot",
      }),
      "goal"
    );
  });

  it("classifies Japanese-only input", () => {
    assert.equal(
      inferDiscoverCategory({ japaneseText: "素晴らしいゴールだ！" }),
      "goal"
    );
    assert.equal(
      inferDiscoverCategory({ japaneseText: "決定的なシュート" }),
      "shot"
    );
    assert.equal(
      inferDiscoverCategory({ meaning: "キーパーが止めた" }),
      "save"
    );
  });

  it("ignores case and surrounding whitespace", () => {
    assert.equal(
      inferDiscoverCategory({ englishText: "  WHAT A FINISH!  " }),
      "goal"
    );
  });

  it("does not mutate the input object", () => {
    const input = {
      englishText: "  What a finish!  ",
      japaneseText: "  決めた  ",
    };
    const before = structuredClone(input);
    inferDiscoverCategory(input);
    assert.deepEqual(input, before);
  });
});

describe("parseDiscoverCategory", () => {
  it("keeps allowed values and falls back to general", () => {
    assert.equal(parseDiscoverCategory("pass"), "pass");
    assert.equal(parseDiscoverCategory("set-piece"), "set-piece");
    assert.equal(parseDiscoverCategory(null), "general");
    assert.equal(parseDiscoverCategory("unknown"), "general");
    assert.equal(parseDiscoverCategory(12), "general");
  });
});

describe("filterDiscoverFeedPosts", () => {
  const posts = [
    makePost("goal-1", {
      category: "goal",
      englishText: "What a finish!",
      createdAt: "2026-07-17T02:00:00.000Z",
    }),
    makePost("shot-1", {
      category: "shot",
      englishText: "He fires a shot",
      createdAt: "2026-07-17T01:00:00.000Z",
    }),
    makePost("pass-1", {
      category: "pass",
      englishText: "Through ball",
      createdAt: "2026-07-17T03:00:00.000Z",
    }),
  ];

  it("filters by category and keeps sort", () => {
    const filtered = filterDiscoverFeedPosts(posts, {
      query: "",
      category: "shot",
      sort: "newest",
    });
    assert.deepEqual(
      filtered.map((post) => post.id),
      ["shot-1"]
    );
  });

  it("applies search and category as AND", () => {
    const filtered = filterDiscoverFeedPosts(posts, {
      query: "finish",
      category: "goal",
      sort: "newest",
    });
    assert.deepEqual(
      filtered.map((post) => post.id),
      ["goal-1"]
    );

    const none = filterDiscoverFeedPosts(posts, {
      query: "finish",
      category: "shot",
      sort: "newest",
    });
    assert.equal(none.length, 0);
  });

  it("shows all categories when filter is all", () => {
    const filtered = filterDiscoverFeedPosts(posts, {
      query: "",
      category: "all",
      sort: "newest",
    });
    assert.deepEqual(
      filtered.map((post) => post.id),
      ["pass-1", "goal-1", "shot-1"]
    );
  });
});
