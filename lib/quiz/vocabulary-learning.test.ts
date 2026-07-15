import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createQuizQuestions } from "@/lib/quiz/create-quiz-questions";
import { getVocabularyUpdateForQuizAnswer } from "@/lib/quiz/vocabulary-learning";
import type { QuizQuestion } from "@/types/quiz";
import type { VocabularyItem } from "@/types/vocabulary";

function makeVocab(
  id: string,
  englishText: string,
  meaning: string
): VocabularyItem {
  return {
    id,
    englishText,
    meaning,
    japaneseText: `JP ${englishText}`,
    createdAt: "2026-07-15T00:00:00.000Z",
    status: "new",
    correctStreak: 0,
  };
}

function makeQuestion(
  overrides: Partial<QuizQuestion> = {}
): QuizQuestion {
  return {
    id: "q0",
    vocabularyId: "vocab-1",
    meaning: "意味",
    japaneseText: "日本語",
    correctText: "Correct",
    options: [
      { id: "q0-opt0", englishText: "Wrong", isCorrect: false },
      { id: "q0-opt1", englishText: "Correct", isCorrect: true },
      { id: "q0-opt2", englishText: "Wrong B", isCorrect: false },
      { id: "q0-opt3", englishText: "Wrong C", isCorrect: false },
    ],
    ...overrides,
  };
}

describe("createQuizQuestions vocabularyId", () => {
  it("sets vocabularyId from source Vocabulary items", () => {
    const items = [
      makeVocab("id-a", "Phrase A", "意味A"),
      makeVocab("id-b", "Phrase B", "意味B"),
      makeVocab("id-c", "Phrase C", "意味C"),
      makeVocab("id-d", "Phrase D", "意味D"),
    ];
    const questions = createQuizQuestions(items);
    assert.ok(questions.length >= 4);

    for (const question of questions) {
      assert.ok(question.vocabularyId);
      assert.notEqual(question.vocabularyId, question.id);
      assert.match(question.id, /^q\d+$/);
      const source = items.find((item) => item.id === question.vocabularyId);
      assert.ok(source);
      assert.equal(question.correctText, source.englishText);
    }

    const ids = new Set(questions.map((question) => question.vocabularyId));
    assert.equal(ids.size, questions.length);
  });
});

describe("getVocabularyUpdateForQuizAnswer", () => {
  const activeSession = {
    phase: "active" as const,
    selectedOptionId: null,
    questions: [makeQuestion()],
    index: 0,
  };

  it("returns update for a first correct answer with vocabularyId", () => {
    assert.deepEqual(
      getVocabularyUpdateForQuizAnswer(activeSession, "q0-opt1"),
      { vocabularyId: "vocab-1", isCorrect: true }
    );
  });

  it("returns update for a first incorrect answer with vocabularyId", () => {
    assert.deepEqual(
      getVocabularyUpdateForQuizAnswer(activeSession, "q0-opt0"),
      { vocabularyId: "vocab-1", isCorrect: false }
    );
  });

  it("returns null when vocabularyId is missing", () => {
    const session = {
      ...activeSession,
      questions: [makeQuestion({ vocabularyId: undefined })],
    };
    assert.equal(
      getVocabularyUpdateForQuizAnswer(session, "q0-opt1"),
      null
    );
  });

  it("returns null when the question was already answered", () => {
    const session = {
      ...activeSession,
      selectedOptionId: "q0-opt1",
    };
    assert.equal(
      getVocabularyUpdateForQuizAnswer(session, "q0-opt0"),
      null
    );
  });

  it("returns null on the result phase", () => {
    assert.equal(
      getVocabularyUpdateForQuizAnswer(
        { ...activeSession, phase: "result" },
        "q0-opt1"
      ),
      null
    );
  });
});
