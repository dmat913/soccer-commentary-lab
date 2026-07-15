import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getVocabularyUpdateForDailyAnswer } from "@/lib/daily/vocabulary-learning";
import type { DailyChallenge } from "@/types/daily-challenge";
import type { QuizQuestion } from "@/types/quiz";

function makeQuestion(id: string): QuizQuestion {
  return {
    id,
    meaning: "meaning",
    japaneseText: "日本語",
    correctText: "Correct phrase",
    options: [
      { id: `${id}-opt0`, englishText: "Wrong A", isCorrect: false },
      { id: `${id}-opt1`, englishText: "Correct phrase", isCorrect: true },
      { id: `${id}-opt2`, englishText: "Wrong B", isCorrect: false },
      { id: `${id}-opt3`, englishText: "Wrong C", isCorrect: false },
    ],
  };
}

function makeRecord(
  overrides: Partial<DailyChallenge> = {}
): DailyChallenge {
  const question = makeQuestion("q0");
  return {
    challengeDate: "2026-07-15",
    status: "in_progress",
    questions: [question],
    questionVocabularyIds: ["vocab-1"],
    currentQuestionIndex: 0,
    answers: [],
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    startedAt: "2026-07-15T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("getVocabularyUpdateForDailyAnswer", () => {
  it("returns vocabularyId and isCorrect for a first correct answer", () => {
    const update = getVocabularyUpdateForDailyAnswer(
      makeRecord(),
      "q0-opt1"
    );
    assert.deepEqual(update, {
      vocabularyId: "vocab-1",
      isCorrect: true,
    });
  });

  it("returns vocabularyId and isCorrect for a first incorrect answer", () => {
    const update = getVocabularyUpdateForDailyAnswer(
      makeRecord(),
      "q0-opt0"
    );
    assert.deepEqual(update, {
      vocabularyId: "vocab-1",
      isCorrect: false,
    });
  });

  it("returns null when vocabularyId is missing", () => {
    const update = getVocabularyUpdateForDailyAnswer(
      makeRecord({ questionVocabularyIds: [null] }),
      "q0-opt1"
    );
    assert.equal(update, null);
  });

  it("returns null when the question was already answered", () => {
    const update = getVocabularyUpdateForDailyAnswer(
      makeRecord({
        answers: [
          {
            questionId: "q0",
            vocabularyId: "vocab-1",
            selectedOptionId: "q0-opt1",
            isCorrect: true,
          },
        ],
      }),
      "q0-opt0"
    );
    assert.equal(update, null);
  });

  it("returns null for a restored completed challenge", () => {
    const update = getVocabularyUpdateForDailyAnswer(
      makeRecord({
        status: "completed",
        answers: [
          {
            questionId: "q0",
            vocabularyId: "vocab-1",
            selectedOptionId: "q0-opt1",
            isCorrect: true,
          },
        ],
        completedAt: "2026-07-15T01:00:00.000Z",
      }),
      "q0-opt1"
    );
    assert.equal(update, null);
  });

  it("returns null when record is null", () => {
    assert.equal(getVocabularyUpdateForDailyAnswer(null, "q0-opt1"), null);
  });
});
