import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adjustDiscoverSaveCount,
  applySaveCountDeltaToPosts,
  createSavedPostIdSet,
  isPostSavedInDiscover,
  restoreSaveCountOnPosts,
  withSavedPostId,
} from "@/lib/discover/save-state";
import { sortDiscoverPosts } from "@/lib/discover/sorting";
import {
  isDiscoverPostSavedInVocabulary,
  isDiscoverVocabularyAddedInUi,
  mapDiscoverPostToVocabularyAddEntry,
} from "@/lib/discover/vocabulary-mapping";
import type { DiscoverPost } from "@/types/discover";

function makePost(
  id: string,
  overrides: Partial<DiscoverPost> = {}
): DiscoverPost {
  return {
    id,
    englishText: "What a finish!",
    japaneseText: "なんてフィニッシュだ！",
    meaning: "素晴らしいフィニッシュ",
    learningPointText: "What a finish",
    learningPointMeaning: "素晴らしい決定打",
    category: "general",
    heardCount: 0,
    recentHeardCount: 0,
    saveCount: 0,
    createdAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapDiscoverPostToVocabularyAddEntry", () => {
  it("maps Discover fields into a Vocabulary add entry", () => {
    const entry = mapDiscoverPostToVocabularyAddEntry(
      makePost("1", {
        englishText: "  Absolute screamer!  ",
        meaning: "  強烈な一撃  ",
        japaneseText: "  強烈なシュート！  ",
        learningPointText: "  Absolute screamer  ",
        learningPointMeaning: "  強烈な一撃  ",
      })
    );

    assert.deepEqual(entry, {
      englishText: "Absolute screamer!",
      meaning: "強烈な一撃",
      japaneseText: "強烈なシュート！",
      learningPoint: {
        text: "Absolute screamer",
        meaning: "強烈な一撃",
      },
    });
  });

  it("omits learningPoint when English text is blank", () => {
    const entry = mapDiscoverPostToVocabularyAddEntry(
      makePost("1", {
        learningPointText: "   ",
        learningPointMeaning: "意味だけ",
      })
    );

    assert.equal(entry.learningPoint, undefined);
  });
});

describe("isDiscoverPostSavedInVocabulary", () => {
  it("treats trimmed englishText matches as saved", () => {
    const saved = new Set(["What a finish!"]);
    const isSaved = (englishText: string) =>
      saved.has(englishText.trim());

    assert.equal(
      isDiscoverPostSavedInVocabulary(
        isSaved,
        makePost("1", { englishText: "  What a finish!  " })
      ),
      true
    );
    assert.equal(
      isDiscoverPostSavedInVocabulary(
        isSaved,
        makePost("2", { englishText: "Different" })
      ),
      false
    );
  });
});

describe("isDiscoverVocabularyAddedInUi", () => {
  it("uses Vocabulary membership and ignores orphan discover_saves", () => {
    assert.equal(
      isDiscoverVocabularyAddedInUi({
        isInVocabulary: true,
        hasDiscoverSave: false,
      }),
      true
    );
    assert.equal(
      isDiscoverVocabularyAddedInUi({
        isInVocabulary: false,
        hasDiscoverSave: true,
      }),
      false
    );
    assert.equal(
      isDiscoverVocabularyAddedInUi({
        isInVocabulary: false,
        hasDiscoverSave: false,
      }),
      false
    );
  });
});

describe("discover save state helpers", () => {
  it("tracks saved post ids independently", () => {
    const saved = createSavedPostIdSet(["a"]);
    assert.equal(isPostSavedInDiscover(saved, "a"), true);
    assert.equal(isPostSavedInDiscover(saved, "b"), false);

    const afterAdd = withSavedPostId(saved, "b", true);
    assert.equal(isPostSavedInDiscover(afterAdd, "b"), true);
    assert.equal(isPostSavedInDiscover(saved, "b"), false);
  });

  it("increments saveCount without going below zero", () => {
    assert.equal(adjustDiscoverSaveCount(2, 1), 3);
    assert.equal(adjustDiscoverSaveCount(0, -1), 0);
  });

  it("updates saveCount on a single post and restores it", () => {
    const posts = [
      makePost("a", { saveCount: 1, heardCount: 9 }),
      makePost("b", { saveCount: 4, heardCount: 1 }),
    ];

    const updated = applySaveCountDeltaToPosts(posts, "a", 1);
    assert.equal(updated[0]?.saveCount, 2);
    assert.equal(updated[0]?.heardCount, 9);
    assert.equal(updated[1]?.saveCount, 4);

    const restored = restoreSaveCountOnPosts(updated, "a", 1);
    assert.equal(restored[0]?.saveCount, 1);
  });

  it("keeps popular sort on saveCount after updates", () => {
    const posts = [
      makePost("low", { saveCount: 1, englishText: "low" }),
      makePost("high", { saveCount: 5, englishText: "high" }),
    ];
    const updated = applySaveCountDeltaToPosts(posts, "low", 10);
    const sorted = sortDiscoverPosts(updated, "popular");
    assert.equal(sorted[0]?.id, "low");

    const byHeard = sortDiscoverPosts(updated, "trending");
    assert.equal(byHeard[0]?.heardCount, 0);
  });
});
