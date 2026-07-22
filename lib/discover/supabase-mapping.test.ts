import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRecentHeardCountMap,
  findPublishedPostByEnglishText,
  mapDiscoverPostRowToPost,
  mapFavoriteToDiscoverPostInsert,
  normalizeDiscoverEnglishText,
  type DiscoverPostRow,
  type DiscoverTrendingStatsRow,
} from "@/lib/discover/supabase-mapping";
import type { DiscoverPublishedPost } from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";

function makeFavorite(
  overrides: Partial<FavoriteTranslation> = {}
): FavoriteTranslation {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    japaneseText: "  なんという決め方だ！  ",
    text: "  What a finish!  ",
    meaning: "  最高のフィニッシュを称賛する表現。  ",
    explanation: "公開には含めない補足",
    learningPoint: {
      text: "  What a + noun  ",
      meaning: "  なんという〜だ、という強調。  ",
    },
    createdAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function makePublishedPost(
  overrides: Partial<DiscoverPublishedPost> = {}
): DiscoverPublishedPost {
  return {
    id: "post-1",
    englishText: "What a finish!",
    sourceFavoriteId: "favorite-1",
    createdAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapFavoriteToDiscoverPostInsert", () => {
  it("maps and trims complete Favorite snapshot fields", () => {
    const row = mapFavoriteToDiscoverPostInsert(makeFavorite(), "user-1");

    assert.deepEqual(row, {
      user_id: "user-1",
      source_favorite_id: "11111111-1111-4111-8111-111111111111",
      english_text: "What a finish!",
      meaning: "最高のフィニッシュを称賛する表現。",
      japanese_text: "なんという決め方だ！",
      learning_point_text: "What a + noun",
      learning_point_meaning: "なんという〜だ、という強調。",
      category: "goal",
    });
    assert.equal("explanation" in row, false);
    assert.equal("email" in row, false);
    assert.equal("profile" in row, false);
  });

  it("falls back meaning to japanese when meaning is missing", () => {
    const row = mapFavoriteToDiscoverPostInsert(
      makeFavorite({ meaning: "  " }),
      "user-1"
    );
    assert.equal(row.meaning, "なんという決め方だ！");
    assert.equal(row.japanese_text, "なんという決め方だ！");
  });

  it("falls back learning point English to commentary text", () => {
    const row = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        learningPoint: { text: " ", meaning: "LP意味" },
      }),
      "user-1"
    );
    assert.equal(row.learning_point_text, "What a finish!");
    assert.equal(row.learning_point_meaning, "LP意味");
  });

  it("uses legacy vocabulary English when learning point English is missing", () => {
    const row = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        learningPoint: undefined,
        vocabulary: { word: "  screamer  ", meaning: "  強烈な一撃  " },
      }),
      "user-1"
    );
    assert.equal(row.learning_point_text, "screamer");
    assert.equal(row.learning_point_meaning, "強烈な一撃");
  });

  it("falls back learning point meaning via explanation → meaning → japanese", () => {
    const viaExplanation = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        learningPoint: { text: "What a finish", meaning: "" },
        explanation: "  誇張した称賛  ",
      }),
      "user-1"
    );
    assert.equal(viaExplanation.learning_point_meaning, "誇張した称賛");

    const viaMeaning = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        learningPoint: { text: "What a finish", meaning: " " },
        explanation: "  ",
        meaning: "  称賛の意味  ",
      }),
      "user-1"
    );
    assert.equal(viaMeaning.learning_point_meaning, "称賛の意味");

    const viaJapanese = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        learningPoint: undefined,
        vocabulary: undefined,
        explanation: "",
        meaning: "   ",
      }),
      "user-1"
    );
    assert.equal(viaJapanese.learning_point_text, "What a finish!");
    assert.equal(viaJapanese.learning_point_meaning, "なんという決め方だ！");
    assert.equal(viaJapanese.meaning, "なんという決め方だ！");
  });

  it("never sends blank required fields for incomplete Favorites", () => {
    const row = mapFavoriteToDiscoverPostInsert(
      makeFavorite({
        meaning: "",
        explanation: undefined,
        learningPoint: undefined,
        vocabulary: undefined,
      }),
      "user-1"
    );

    assert.ok(row.english_text.length > 0);
    assert.ok(row.japanese_text.length > 0);
    assert.ok(row.meaning.length > 0);
    assert.ok(row.learning_point_text.length > 0);
    assert.ok(row.learning_point_meaning.length > 0);
  });

  it("rejects a Favorite missing English or Japanese", () => {
    assert.throws(() =>
      mapFavoriteToDiscoverPostInsert(makeFavorite({ text: "  " }), "user-1")
    );
    assert.throws(() =>
      mapFavoriteToDiscoverPostInsert(
        makeFavorite({ japaneseText: "" }),
        "user-1"
      )
    );
  });
});

describe("published-state matching", () => {
  it("normalizes surrounding whitespace", () => {
    assert.equal(
      normalizeDiscoverEnglishText("  What a finish!  "),
      "What a finish!"
    );
  });

  it("finds the same user's post by trim-normalized English text", () => {
    const ownPosts = [makePublishedPost()];
    assert.equal(
      findPublishedPostByEnglishText(ownPosts, "  What a finish!  ")?.id,
      "post-1"
    );
  });

  it("does not let another user's scoped list affect the current user", () => {
    const currentUsersPosts: DiscoverPublishedPost[] = [];
    const anotherUsersPosts = [makePublishedPost()];

    assert.equal(
      findPublishedPostByEnglishText(
        currentUsersPosts,
        anotherUsersPosts[0].englishText
      ),
      undefined
    );
  });
});

describe("trending stats mapping", () => {
  const postRow: DiscoverPostRow = {
    id: "post-a",
    english_text: "What a finish!",
    japanese_text: "なんという決め方だ！",
    meaning: "称賛",
    learning_point_text: "What a",
    learning_point_meaning: "なんという",
    created_at: "2026-07-17T00:00:00.000Z",
  };

  it("merges recentHeardCount from RPC rows and defaults missing posts to 0", () => {
    const rows: DiscoverTrendingStatsRow[] = [
      {
        post_id: "post-a",
        recent_heard_count: "12",
        total_heard_count: "100",
      },
    ];
    const recentByPostId = buildRecentHeardCountMap(rows);

    assert.equal(recentByPostId.get("post-a"), 12);
    assert.equal(recentByPostId.get("post-b"), undefined);

    const mapped = mapDiscoverPostRowToPost(postRow, {
      heardCount: 100,
      recentHeardCount: recentByPostId.get(postRow.id) ?? 0,
      saveCount: 3,
    });
    assert.equal(mapped.recentHeardCount, 12);
    assert.equal(mapped.heardCount, 100);
    assert.equal(mapped.saveCount, 3);
    assert.equal(mapped.category, "general");
    assert.equal("user_id" in mapped, false);
  });

  it("maps valid category and falls back invalid category to general", () => {
    const withCategory = mapDiscoverPostRowToPost({
      ...postRow,
      category: "pass",
    });
    assert.equal(withCategory.category, "pass");

    const invalid = mapDiscoverPostRowToPost({
      ...postRow,
      category: "not-a-category",
    });
    assert.equal(invalid.category, "general");

    const missing = mapDiscoverPostRowToPost({
      ...postRow,
      category: null,
    });
    assert.equal(missing.category, "general");
  });

  it("normalizes null-like trending values to 0", () => {
    const recentByPostId = buildRecentHeardCountMap([
      {
        post_id: "post-a",
        recent_heard_count: null as unknown as number,
        total_heard_count: "x",
      },
    ]);
    assert.equal(recentByPostId.get("post-a"), 0);

    const mapped = mapDiscoverPostRowToPost(postRow);
    assert.equal(mapped.recentHeardCount, 0);
    assert.equal(mapped.heardCount, 0);
    assert.equal(mapped.saveCount, 0);
  });
});
