import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterVocabularyItems,
  formatVocabularyReviewedAt,
  formatVocabularyReviewRecency,
  getVocabularyReviewRecommendations,
  vocabularyFilterEmptyCopy,
  vocabularyStatusLabel,
  vocabularyStreakProgressLabel,
  summarizeVocabularyLearning,
  sortVocabularyItems,
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

describe("getVocabularyReviewRecommendations", () => {
  it("prefers learning over new", () => {
    const items = [
      makeItem({
        id: "new-old",
        englishText: "New old",
        status: "new",
        createdAt: "2026-06-01T00:00:00.000Z",
      }),
      makeItem({
        id: "learning",
        englishText: "Learning",
        status: "learning",
        createdAt: "2026-07-10T00:00:00.000Z",
        lastReviewedAt: "2026-07-11T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      getVocabularyReviewRecommendations(items).map((item) => item.id),
      ["learning", "new-old"]
    );
  });

  it("puts learning without lastReviewedAt first", () => {
    const items = [
      makeItem({
        id: "reviewed",
        englishText: "Reviewed",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-02T00:00:00.000Z",
      }),
      makeItem({
        id: "never",
        englishText: "Never",
        status: "learning",
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
    ];
    assert.equal(getVocabularyReviewRecommendations(items)[0].id, "never");
  });

  it("orders learning by oldest lastReviewedAt", () => {
    const items = [
      makeItem({
        id: "newer",
        englishText: "Newer",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-10T00:00:00.000Z",
      }),
      makeItem({
        id: "older",
        englishText: "Older",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-03T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      getVocabularyReviewRecommendations(items).map((item) => item.id),
      ["older", "newer"]
    );
  });

  it("tie-breaks learning by oldest createdAt", () => {
    const sameReview = "2026-07-05T00:00:00.000Z";
    const items = [
      makeItem({
        id: "newer-created",
        englishText: "Newer",
        status: "learning",
        createdAt: "2026-07-10T00:00:00.000Z",
        lastReviewedAt: sameReview,
      }),
      makeItem({
        id: "older-created",
        englishText: "Older",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: sameReview,
      }),
    ];
    assert.equal(
      getVocabularyReviewRecommendations(items)[0].id,
      "older-created"
    );
  });

  it("fills with oldest new when learning is under the limit", () => {
    const items = [
      makeItem({
        id: "learning",
        englishText: "Learning",
        status: "learning",
        createdAt: "2026-07-10T00:00:00.000Z",
        lastReviewedAt: "2026-07-11T00:00:00.000Z",
      }),
      makeItem({
        id: "new-newer",
        englishText: "New newer",
        status: "new",
        createdAt: "2026-07-08T00:00:00.000Z",
      }),
      makeItem({
        id: "new-older",
        englishText: "New older",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "mastered",
        englishText: "Mastered",
        status: "mastered",
        createdAt: "2026-06-01T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      getVocabularyReviewRecommendations(items).map((item) => item.id),
      ["learning", "new-older", "new-newer"]
    );
  });

  it("excludes mastered and returns empty when all are mastered", () => {
    const items = [
      makeItem({
        id: "m1",
        englishText: "M1",
        status: "mastered",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "m2",
        englishText: "M2",
        status: "mastered",
        createdAt: "2026-07-02T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(getVocabularyReviewRecommendations(items), []);
  });

  it("caps at 3, avoids duplicates, and does not mutate input", () => {
    const items = [
      makeItem({
        id: "l1",
        englishText: "L1",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "l2",
        englishText: "L2",
        status: "learning",
        createdAt: "2026-07-02T00:00:00.000Z",
        lastReviewedAt: "2026-07-03T00:00:00.000Z",
      }),
      makeItem({
        id: "l3",
        englishText: "L3",
        status: "learning",
        createdAt: "2026-07-03T00:00:00.000Z",
        lastReviewedAt: "2026-07-04T00:00:00.000Z",
      }),
      makeItem({
        id: "l4",
        englishText: "L4",
        status: "learning",
        createdAt: "2026-07-04T00:00:00.000Z",
        lastReviewedAt: "2026-07-05T00:00:00.000Z",
      }),
      makeItem({
        id: "n1",
        englishText: "N1",
        status: "new",
        createdAt: "2026-06-01T00:00:00.000Z",
      }),
    ];
    const originalOrder = items.map((item) => item.id);
    const picked = getVocabularyReviewRecommendations(items);
    assert.equal(picked.length, 3);
    assert.deepEqual(
      picked.map((item) => item.id),
      ["l1", "l2", "l3"]
    );
    assert.equal(new Set(picked.map((item) => item.id)).size, 3);
    assert.deepEqual(
      items.map((item) => item.id),
      originalOrder
    );
  });

  it("does not throw on invalid dates", () => {
    const items = [
      makeItem({
        id: "bad-learning",
        englishText: "Bad learning",
        status: "learning",
        createdAt: "not-a-date",
        lastReviewedAt: "also-bad",
      }),
      makeItem({
        id: "bad-new",
        englishText: "Bad new",
        status: "new",
        createdAt: "nope",
      }),
    ];
    assert.doesNotThrow(() => getVocabularyReviewRecommendations(items));
    assert.equal(getVocabularyReviewRecommendations(items).length, 2);
  });

  it("recomputes from a newer repository snapshot array", () => {
    const before = [
      makeItem({
        id: "learn",
        englishText: "Learn",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-02T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      getVocabularyReviewRecommendations(before).map((item) => item.id),
      ["learn"]
    );

    const after = [
      makeItem({
        id: "learn",
        englishText: "Learn",
        status: "mastered",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-15T00:00:00.000Z",
        correctStreak: 3,
      }),
      makeItem({
        id: "new-item",
        englishText: "New",
        status: "new",
        createdAt: "2026-07-14T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      getVocabularyReviewRecommendations(after).map((item) => item.id),
      ["new-item"]
    );
  });
});

describe("formatVocabularyReviewRecency", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z");

  it("returns 未学習 when missing or invalid", () => {
    assert.equal(formatVocabularyReviewRecency(undefined, now), "未学習");
    assert.equal(formatVocabularyReviewRecency("bad", now), "未学習");
  });

  it("returns relative day labels for recent reviews", () => {
    assert.equal(
      formatVocabularyReviewRecency("2026-07-15T08:00:00.000Z", now),
      "今日"
    );
    assert.equal(
      formatVocabularyReviewRecency("2026-07-14T08:00:00.000Z", now),
      "昨日"
    );
    assert.equal(
      formatVocabularyReviewRecency("2026-07-12T08:00:00.000Z", now),
      "3日前"
    );
  });
});

describe("summarizeVocabularyLearning", () => {
  it("counts total and each status from the current list", () => {
    const summary = summarizeVocabularyLearning([
      makeItem({ id: "1", englishText: "A", status: "new" }),
      makeItem({ id: "2", englishText: "B", status: "new" }),
      makeItem({ id: "3", englishText: "C", status: "learning" }),
      makeItem({ id: "4", englishText: "D", status: "mastered" }),
    ]);
    assert.deepEqual(summary, {
      total: 4,
      newCount: 2,
      learningCount: 1,
      masteredCount: 1,
    });
  });

  it("returns zeros for an empty list", () => {
    assert.deepEqual(summarizeVocabularyLearning([]), {
      total: 0,
      newCount: 0,
      learningCount: 0,
      masteredCount: 0,
    });
  });
});

describe("sortVocabularyItems", () => {
  it("sorts by recently-added createdAt descending and stays stable", () => {
    const items = [
      makeItem({
        id: "old",
        englishText: "Old",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "new",
        englishText: "New",
        status: "new",
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
      makeItem({
        id: "mid",
        englishText: "Mid",
        status: "new",
        createdAt: "2026-07-05T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "recently-added").map((item) => item.id),
      ["new", "mid", "old"]
    );

    const sameTime = [
      makeItem({
        id: "a",
        englishText: "A",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "b",
        englishText: "B",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(sameTime, "recently-added").map((item) => item.id),
      ["a", "b"]
    );
  });

  it("handles invalid createdAt without throwing", () => {
    const items = [
      makeItem({
        id: "bad",
        englishText: "Bad",
        status: "new",
        createdAt: "not-a-date",
      }),
      makeItem({
        id: "good",
        englishText: "Good",
        status: "new",
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
    ];
    assert.doesNotThrow(() =>
      sortVocabularyItems(items, "recently-added")
    );
    assert.equal(
      sortVocabularyItems(items, "recently-added")[0].id,
      "good"
    );
  });

  it("sorts by recently-reviewed with unreviewed last", () => {
    const items = [
      makeItem({
        id: "never",
        englishText: "Never",
        status: "new",
        createdAt: "2026-07-12T00:00:00.000Z",
      }),
      makeItem({
        id: "older-review",
        englishText: "Older",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-02T00:00:00.000Z",
      }),
      makeItem({
        id: "newer-review",
        englishText: "Newer",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-08T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "recently-reviewed").map((item) => item.id),
      ["newer-review", "older-review", "never"]
    );
  });

  it("uses createdAt among unreviewed items for recently-reviewed", () => {
    const items = [
      makeItem({
        id: "older-added",
        englishText: "Older",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "newer-added",
        englishText: "Newer",
        status: "new",
        createdAt: "2026-07-09T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "recently-reviewed").map((item) => item.id),
      ["newer-added", "older-added"]
    );
  });

  it("orders learning → new → mastered, then by review/created", () => {
    const items = [
      makeItem({
        id: "mastered",
        englishText: "M",
        status: "mastered",
        createdAt: "2026-07-10T00:00:00.000Z",
        lastReviewedAt: "2026-07-11T00:00:00.000Z",
      }),
      makeItem({
        id: "new-item",
        englishText: "N",
        status: "new",
        createdAt: "2026-07-10T00:00:00.000Z",
      }),
      makeItem({
        id: "learning-old",
        englishText: "L1",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-02T00:00:00.000Z",
      }),
      makeItem({
        id: "learning-new",
        englishText: "L2",
        status: "learning",
        createdAt: "2026-07-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-08T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "learning-first").map((item) => item.id),
      ["learning-new", "learning-old", "new-item", "mastered"]
    );
  });

  it("orders unreviewed learning-first by createdAt within the same status", () => {
    const items = [
      makeItem({
        id: "new-old",
        englishText: "Old",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "new-fresh",
        englishText: "Fresh",
        status: "new",
        createdAt: "2026-07-09T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "learning-first").map((item) => item.id),
      ["new-fresh", "new-old"]
    );
  });

  it("sorts A–Z by English label case-insensitively and ignoring trim", () => {
    const items = [
      makeItem({
        id: "z",
        englishText: "  zebra  ",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "a",
        englishText: "Apple",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "b",
        englishText: "banana",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
    ];
    assert.deepEqual(
      sortVocabularyItems(items, "a-z").map((item) => item.id),
      ["a", "b", "z"]
    );
  });

  it("does not mutate the original array and works after filtering", () => {
    const items = [
      makeItem({
        id: "1",
        englishText: "What a finish",
        status: "new",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      makeItem({
        id: "2",
        englishText: "Through ball",
        status: "learning",
        createdAt: "2026-07-05T00:00:00.000Z",
      }),
      makeItem({
        id: "3",
        englishText: "Off the post",
        status: "mastered",
        createdAt: "2026-07-08T00:00:00.000Z",
      }),
    ];
    const originalOrder = items.map((item) => item.id);
    const filtered = filterVocabularyItems(items, "", "learning");
    const sorted = sortVocabularyItems(filtered, "a-z");
    assert.deepEqual(
      items.map((item) => item.id),
      originalOrder
    );
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["2"]
    );
  });
});
