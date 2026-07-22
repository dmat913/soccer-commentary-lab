import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canPublishFavoriteToDiscover,
  getDiscoverPublishUnavailableReason,
  getFavoriteRemoteEnrichmentPatch,
  mapFavoriteRowToTranslation,
  mapFavoriteTranslationToInsertRow,
  type FavoriteRow,
} from "@/lib/favorites/supabase-mapping";
import type { FavoriteTranslation } from "@/types/favorite";

function makeRow(overrides: Partial<FavoriteRow> = {}): FavoriteRow {
  return {
    id: "fav-1",
    user_id: "user-1",
    japanese_text: "素晴らしいゴール",
    english_text: "What a finish",
    style: null,
    meaning: "素晴らしい決め方だ",
    explanation: "誇張した称賛",
    learning_point: "What a finish",
    learning_point_meaning: "素晴らしいフィニッシュだという表現",
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function makeFavorite(
  overrides: Partial<FavoriteTranslation> = {}
): FavoriteTranslation {
  return {
    id: "fav-1",
    japaneseText: "素晴らしいゴール",
    text: "What a finish",
    meaning: "素晴らしい決め方だ",
    explanation: "誇張した称賛",
    learningPoint: {
      text: "What a finish",
      meaning: "素晴らしいフィニッシュだという表現",
    },
    createdAt: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapFavoriteRowToTranslation", () => {
  it("restores all content fields from a complete row", () => {
    const favorite = mapFavoriteRowToTranslation(makeRow());
    assert.equal(favorite.meaning, "素晴らしい決め方だ");
    assert.equal(favorite.explanation, "誇張した称賛");
    assert.deepEqual(favorite.learningPoint, {
      text: "What a finish",
      meaning: "素晴らしいフィニッシュだという表現",
    });
  });

  it("falls back safely when added columns are null", () => {
    assert.doesNotThrow(() =>
      mapFavoriteRowToTranslation(
        makeRow({
          meaning: null,
          explanation: null,
          learning_point: null,
          learning_point_meaning: null,
        })
      )
    );

    const favorite = mapFavoriteRowToTranslation(
      makeRow({
        meaning: null,
        explanation: null,
        learning_point: null,
        learning_point_meaning: null,
      })
    );
    assert.equal(favorite.meaning, "");
    assert.equal(favorite.explanation, undefined);
    assert.equal(favorite.learningPoint, undefined);
  });

  it("keeps learningPoint when only English text exists", () => {
    const favorite = mapFavoriteRowToTranslation(
      makeRow({
        learning_point: "What a finish",
        learning_point_meaning: null,
      })
    );
    assert.deepEqual(favorite.learningPoint, {
      text: "What a finish",
      meaning: "",
    });
  });

  it("keeps learningPoint when only meaning exists", () => {
    const favorite = mapFavoriteRowToTranslation(
      makeRow({
        learning_point: null,
        learning_point_meaning: "素晴らしいフィニッシュ",
      })
    );
    assert.deepEqual(favorite.learningPoint, {
      text: "",
      meaning: "素晴らしいフィニッシュ",
    });
  });

  it("restores explanation when present", () => {
    const favorite = mapFavoriteRowToTranslation(
      makeRow({ explanation: "  extra note  " })
    );
    assert.equal(favorite.explanation, "extra note");
  });
});

describe("mapFavoriteTranslationToInsertRow", () => {
  it("maps Favorite fields onto added DB columns", () => {
    const row = mapFavoriteTranslationToInsertRow(makeFavorite(), "user-1");
    assert.equal(row.english_text, "What a finish");
    assert.equal(row.meaning, "素晴らしい決め方だ");
    assert.equal(row.japanese_text, "素晴らしいゴール");
    assert.equal(row.explanation, "誇張した称賛");
    assert.equal(row.learning_point, "What a finish");
    assert.equal(
      row.learning_point_meaning,
      "素晴らしいフィニッシュだという表現"
    );
    assert.equal(row.style, null);
    assert.equal(row.user_id, "user-1");
  });

  it("stores null for missing optional content fields", () => {
    const row = mapFavoriteTranslationToInsertRow(
      makeFavorite({
        meaning: "   ",
        explanation: undefined,
        learningPoint: undefined,
      }),
      "user-1"
    );
    assert.equal(row.meaning, null);
    assert.equal(row.explanation, null);
    assert.equal(row.learning_point, null);
    assert.equal(row.learning_point_meaning, null);
  });
});

describe("getFavoriteRemoteEnrichmentPatch", () => {
  it("fills empty remote fields from local without creating a new identity", () => {
    const patch = getFavoriteRemoteEnrichmentPatch(
      makeFavorite({
        meaning: "",
        explanation: undefined,
        learningPoint: { text: "", meaning: "" },
      }),
      makeFavorite()
    );
    assert.deepEqual(patch, {
      meaning: "素晴らしい決め方だ",
      explanation: "誇張した称賛",
      learning_point: "What a finish",
      learning_point_meaning: "素晴らしいフィニッシュだという表現",
    });
  });

  it("does not overwrite non-empty remote values", () => {
    const patch = getFavoriteRemoteEnrichmentPatch(
      makeFavorite({
        meaning: "remote meaning",
        explanation: "remote explanation",
        learningPoint: {
          text: "remote LP",
          meaning: "remote LP meaning",
        },
      }),
      makeFavorite()
    );
    assert.equal(patch, null);
  });

  it("only patches the fields that are empty on remote", () => {
    const patch = getFavoriteRemoteEnrichmentPatch(
      makeFavorite({
        meaning: "keep remote",
        explanation: undefined,
        learningPoint: {
          text: "keep LP",
          meaning: "",
        },
      }),
      makeFavorite()
    );
    assert.deepEqual(patch, {
      explanation: "誇張した称賛",
      learning_point_meaning: "素晴らしいフィニッシュだという表現",
    });
  });
});

describe("canPublishFavoriteToDiscover", () => {
  it("returns true when English and Japanese are present", () => {
    assert.equal(canPublishFavoriteToDiscover(makeFavorite()), true);
  });

  it("returns true when meaning is missing", () => {
    assert.equal(
      canPublishFavoriteToDiscover(makeFavorite({ meaning: "  " })),
      true
    );
  });

  it("returns true when learning point English is missing", () => {
    assert.equal(
      canPublishFavoriteToDiscover(
        makeFavorite({
          learningPoint: {
            text: " ",
            meaning: "意味",
          },
        })
      ),
      true
    );
  });

  it("returns true when learning point meaning is missing", () => {
    assert.equal(
      canPublishFavoriteToDiscover(
        makeFavorite({
          learningPoint: {
            text: "What a finish",
            meaning: "",
          },
        })
      ),
      true
    );
  });

  it("returns false when English is blank", () => {
    assert.equal(
      canPublishFavoriteToDiscover(
        makeFavorite({
          text: "  ",
          japaneseText: "日本語",
        })
      ),
      false
    );
  });

  it("returns false when Japanese is blank", () => {
    assert.equal(
      canPublishFavoriteToDiscover(
        makeFavorite({
          text: "What a finish!",
          japaneseText: " ",
        })
      ),
      false
    );
  });
});

describe("getDiscoverPublishUnavailableReason", () => {
  it("explains missing English or Japanese specifically", () => {
    assert.equal(
      getDiscoverPublishUnavailableReason(makeFavorite({ text: "" })),
      "英語実況がないため公開できません"
    );
    assert.equal(
      getDiscoverPublishUnavailableReason(
        makeFavorite({ japaneseText: "  " })
      ),
      "元の日本語がないため公開できません"
    );
    assert.equal(
      getDiscoverPublishUnavailableReason(makeFavorite({ meaning: "" })),
      null
    );
  });
});
