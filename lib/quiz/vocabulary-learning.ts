import type { QuizQuestion } from "@/types/quiz";

export type QuizAnswerVocabularyUpdate = {
  vocabularyId: string;
  isCorrect: boolean;
};

type QuizAnswerSessionSnapshot = {
  phase: "active" | "result";
  selectedOptionId: string | null;
  questions: QuizQuestion[];
  index: number;
};

/**
 * Returns the Vocabulary learning update for a first-time Quiz answer.
 * Null when already answered, option missing, or vocabularyId absent.
 * Evaluate against the pre-answer session, then dispatch the answer, then apply.
 */
export function getVocabularyUpdateForQuizAnswer(
  session: QuizAnswerSessionSnapshot | null,
  optionId: string
): QuizAnswerVocabularyUpdate | null {
  if (!session || session.phase !== "active" || session.selectedOptionId !== null) {
    return null;
  }

  const question = session.questions[session.index];
  if (!question) {
    return null;
  }

  const option = question.options.find(
    (candidate) => candidate.id === optionId
  );
  if (!option) {
    return null;
  }

  const vocabularyId = question.vocabularyId?.trim();
  if (!vocabularyId) {
    return null;
  }

  return {
    vocabularyId,
    isCorrect: option.isCorrect,
  };
}
