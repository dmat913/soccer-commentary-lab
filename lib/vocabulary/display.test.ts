import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterVocabularyItems,
  formatVocabularyReviewedAt,
  vocabularyFilterEmptyCopy,
  vocabularyStatusLabel,
  vocabularyStreakProgressLabel,
} from "@/lib/vocabulary/display";
import type { VocabularyItem } from "@/types/vocabulary";

function makeItem(
  overrides: Partial<VocabularyItem> &
    Pick<VocabularyItem, "id" | "englishText" | "status">
): VocabularyItem {
  return {
    meaning: "意味",
    japaneseText: "日本語",
    createdAt: "2026-07-15T00:00:00.000Z",
    correctStreak: 0,
    ...overrides,
  };
}

describe("vocabularyStatusLabel", () => {
  it("maps status to display labels", () => {
    assert.equal(vocabularyStatusLabel("new"), "NEW");
    assert.equal(vocabularyStatusLabel("learning"), "学習中");
    assert.equal(vocabularyStatusLabel("mastered"), "習得済み");
  });
});

describe("filterVocabularyItems", () => {
  const items = [
    makeItem({ id: "1", englishText: "What a finish", status: "new" }),
    makeItem({
      id: "2",
      englishText: "Through ball",
      status: "learning",
      correctStreak: 2,
    }),
    makeItem({
      id: "3",
      englishText: "Off the post",
      status: "mastered",
      correctStreak: 3,
    }),
  ];

  it("returns all items for the all filter", () => {
    assert.equal(filterVocabularyItems(items, "", "all").length, 3);
  });

  it("filters by NEW / learning / mastered", () => {
    assert.deepEqual(
      filterVocabularyItems(items, "", "new").map((item) => item.id),
      ["1"]
    );
    assert.deepEqual(
      filterVocabularyItems(items, "", "learning").map((item) => item.id),
      ["2"]
    );
    assert.deepEqual(
      filterVocabularyItems(items, "", "mastered").map((item) => item.id),
      ["3"]
    );
  });

  it("combines search and status filter", () => {
    assert.deepEqual(
      filterVocabularyItems(items, "ball", "learning").map((item) => item.id),
      ["2"]
    );
    assert.deepEqual(
      filterVocabularyItems(items, "ball", "mastered").map((item) => item.id),
      []
    );
  });
});

describe("vocabularyFilterEmptyCopy", () => {
  it("distinguishes search, status, and combined empties", () => {
    assert.equal(
      vocabularyFilterEmptyCopy({ hasQuery: true, statusFilter: "all" }).title,
      "検索結果がありません"
    );
    assert.equal(
      vocabularyFilterEmptyCopy({ hasQuery: false, statusFilter: "mastered" })
        .title,
      "このステータスの表現はまだありません"
    );
    assert.equal(
      vocabularyFilterEmptyCopy({ hasQuery: true, statusFilter: "learning" })
        .title,
      "条件に一致する表現がありません"
    );
  });
});

describe("formatVocabularyReviewedAt / streak label", () => {
  it("shows not-studied copy when lastReviewedAt is missing", () => {
    assert.equal(
      formatVocabularyReviewedAt(undefined),
      "まだ学習していません"
    );
  });

  it("formats a valid lastReviewedAt", () => {
    const label = formatVocabularyReviewedAt("2026-07-15T12:00:00.000Z");
    assert.notEqual(label, "まだ学習していません");
    assert.match(label, /2026/);
  });

  it("shows streak progress from 0 to 3+", () => {
    assert.equal(vocabularyStreakProgressLabel(0), "0 / 3");
    assert.equal(vocabularyStreakProgressLabel(2), "2 / 3");
    assert.equal(vocabularyStreakProgressLabel(3), "3 / 3");
    assert.equal(vocabularyStreakProgressLabel(5), "5 / 3");
  });
});
