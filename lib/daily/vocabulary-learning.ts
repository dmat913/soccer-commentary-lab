import type { DailyChallenge } from "@/types/daily-challenge";

export type DailyAnswerVocabularyUpdate = {
  vocabularyId: string;
  isCorrect: boolean;
};

/**
 * Returns the Vocabulary learning update for a first-time Daily Challenge
 * answer. Null when the answer would be a no-op (already answered, missing
 * option, missing vocabularyId, inactive challenge).
 *
 * Call this against the pre-answer snapshot, then persist the Daily answer,
 * then apply the update — never from restore/sync effects.
 */
export function getVocabularyUpdateForDailyAnswer(
  record: DailyChallenge | null,
  optionId: string
): DailyAnswerVocabularyUpdate | null {
  if (!record || record.status !== "in_progress") {
    return null;
  }

  const question = record.questions[record.currentQuestionIndex];
  if (!question) {
    return null;
  }

  const alreadyAnswered = record.answers.some(
    (answer) => answer.questionId === question.id
  );
  if (alreadyAnswered) {
    return null;
  }

  const option = question.options.find(
    (candidate) => candidate.id === optionId
  );
  if (!option) {
    return null;
  }

  const vocabularyId =
    record.questionVocabularyIds[record.currentQuestionIndex] ?? null;
  if (!vocabularyId) {
    return null;
  }

  return {
    vocabularyId,
    isCorrect: option.isCorrect,
  };
}
