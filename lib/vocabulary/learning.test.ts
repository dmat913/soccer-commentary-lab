import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyVocabularyAnswer,
  markVocabularyStillLearning,
  mergeVocabularyLearningState,
  normalizeVocabularyLearningState,
} from "@/lib/vocabulary/learning";
import { parseVocabularyItem } from "@/lib/vocabulary/storage";

const AT = "2026-07-15T00:00:00.000Z";
const EARLIER = "2026-07-14T00:00:00.000Z";
const LATER = "2026-07-16T00:00:00.000Z";

describe("applyVocabularyAnswer", () => {
  it("moves new to learning with streak 1 on correct", () => {
    const next = applyVocabularyAnswer(
      { status: "new", correctStreak: 0 },
      true,
      AT
    );
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 1);
    assert.equal(next.lastReviewedAt, AT);
  });

  it("moves new to learning with streak 0 on incorrect", () => {
    const next = applyVocabularyAnswer(
      { status: "new", correctStreak: 0 },
      false,
      AT
    );
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 0);
    assert.equal(next.lastReviewedAt, AT);
  });

  it("masters after three consecutive correct answers from learning", () => {
    let state = applyVocabularyAnswer(
      { status: "learning", correctStreak: 0 },
      true,
      AT
    );
    assert.equal(state.status, "learning");
    assert.equal(state.correctStreak, 1);

    state = applyVocabularyAnswer(state, true, AT);
    assert.equal(state.status, "learning");
    assert.equal(state.correctStreak, 2);

    state = applyVocabularyAnswer(state, true, AT);
    assert.equal(state.status, "mastered");
    assert.equal(state.correctStreak, 3);
  });

  it("resets streak to 0 on incorrect while learning", () => {
    const next = applyVocabularyAnswer(
      { status: "learning", correctStreak: 2, lastReviewedAt: EARLIER },
      false,
      AT
    );
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 0);
    assert.equal(next.lastReviewedAt, AT);
  });

  it("demotes mastered to learning with streak 0 on incorrect", () => {
    const next = applyVocabularyAnswer(
      { status: "mastered", correctStreak: 3, lastReviewedAt: EARLIER },
      false,
      AT
    );
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 0);
    assert.equal(next.lastReviewedAt, AT);
  });

  it("updates lastReviewedAt", () => {
    const next = applyVocabularyAnswer(
      { status: "learning", correctStreak: 1 },
      true,
      LATER
    );
    assert.equal(next.lastReviewedAt, LATER);
  });
});

describe("markVocabularyStillLearning", () => {
  it("moves mastered to learning with streak 0", () => {
    const next = markVocabularyStillLearning(
      { status: "mastered", correctStreak: 5, lastReviewedAt: EARLIER },
      AT
    );
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 0);
    assert.equal(next.lastReviewedAt, AT);
  });

  it("updates lastReviewedAt for mastered", () => {
    const next = markVocabularyStillLearning(
      { status: "mastered", correctStreak: 3, lastReviewedAt: EARLIER },
      LATER
    );
    assert.equal(next.lastReviewedAt, LATER);
  });

  it("does not change new status, streak, or lastReviewedAt", () => {
    const current = {
      status: "new" as const,
      correctStreak: 0,
      lastReviewedAt: EARLIER,
    };
    const next = markVocabularyStillLearning(current, AT);
    assert.equal(next.status, "new");
    assert.equal(next.correctStreak, 0);
    assert.equal(next.lastReviewedAt, EARLIER);
  });

  it("does not change learning status, streak, or lastReviewedAt", () => {
    const current = {
      status: "learning" as const,
      correctStreak: 2,
      lastReviewedAt: EARLIER,
    };
    const next = markVocabularyStillLearning(current, AT);
    assert.equal(next.status, "learning");
    assert.equal(next.correctStreak, 2);
    assert.equal(next.lastReviewedAt, EARLIER);
  });

  it("does not reset learning correctStreak", () => {
    const next = markVocabularyStillLearning(
      { status: "learning", correctStreak: 2 },
      AT
    );
    assert.equal(next.correctStreak, 2);
    assert.equal(next.lastReviewedAt, undefined);
  });
});

describe("normalizeVocabularyLearningState / parseVocabularyItem", () => {
  it("treats legacy rows without learning fields as new / 0", () => {
    const item = parseVocabularyItem({
      id: "a",
      englishText: "What a finish!",
      meaning: "素晴らしい",
      japaneseText: "なんてフィニッシュ",
      createdAt: AT,
    });
    assert.ok(item);
    assert.equal(item.status, "new");
    assert.equal(item.correctStreak, 0);
    assert.equal(item.lastReviewedAt, undefined);
  });

  it("falls back invalid status to new", () => {
    const state = normalizeVocabularyLearningState({
      status: "done",
      correctStreak: 2,
    });
    assert.equal(state.status, "new");
    assert.equal(state.correctStreak, 2);
  });

  it("falls back invalid correctStreak to 0", () => {
    const state = normalizeVocabularyLearningState({
      status: "learning",
      correctStreak: -1,
    });
    assert.equal(state.correctStreak, 0);

    const nonNumber = normalizeVocabularyLearningState({
      status: "learning",
      correctStreak: "2",
    });
    assert.equal(nonNumber.correctStreak, 0);
  });

  it("keeps items when meaning is missing", () => {
    const item = parseVocabularyItem({
      id: "b",
      englishText: "Off the post",
      createdAt: AT,
    });
    assert.ok(item);
    assert.equal(item.meaning, "");
    assert.equal(item.status, "new");
  });
});

describe("mergeVocabularyLearningState", () => {
  it("prefers newer local learning over older remote mastered", () => {
    const merged = mergeVocabularyLearningState(
      {
        status: "learning",
        correctStreak: 0,
        lastReviewedAt: LATER,
      },
      {
        status: "mastered",
        correctStreak: 3,
        lastReviewedAt: EARLIER,
      }
    );
    assert.equal(merged.status, "learning");
    assert.equal(merged.correctStreak, 0);
    assert.equal(merged.lastReviewedAt, LATER);
  });

  it("prefers newer remote mastered over older local learning", () => {
    const merged = mergeVocabularyLearningState(
      {
        status: "learning",
        correctStreak: 1,
        lastReviewedAt: EARLIER,
      },
      {
        status: "mastered",
        correctStreak: 3,
        lastReviewedAt: LATER,
      }
    );
    assert.equal(merged.status, "mastered");
    assert.equal(merged.correctStreak, 3);
    assert.equal(merged.lastReviewedAt, LATER);
  });

  it("prefers the side that has lastReviewedAt when the other does not", () => {
    const localOnly = mergeVocabularyLearningState(
      { status: "learning", correctStreak: 2, lastReviewedAt: AT },
      { status: "mastered", correctStreak: 3 }
    );
    assert.equal(localOnly.status, "learning");
    assert.equal(localOnly.correctStreak, 2);

    const remoteOnly = mergeVocabularyLearningState(
      { status: "learning", correctStreak: 1 },
      { status: "mastered", correctStreak: 3, lastReviewedAt: AT }
    );
    assert.equal(remoteOnly.status, "mastered");
    assert.equal(remoteOnly.correctStreak, 3);
  });

  it("prefers remote when neither side has lastReviewedAt", () => {
    const merged = mergeVocabularyLearningState(
      { status: "learning", correctStreak: 2 },
      { status: "new", correctStreak: 0 }
    );
    assert.equal(merged.status, "new");
    assert.equal(merged.correctStreak, 0);
  });
});
