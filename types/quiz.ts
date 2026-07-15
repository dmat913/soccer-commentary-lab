import type { CommentaryLearningPoint } from "@/types/commentary";

/**
 * Session-only quiz types for the "Japanese meaning -> English commentary"
 * 4-choice quiz. These intentionally hold no persistence concerns
 * (no DB id, userId, cumulative stats, mastery, timestamps, Supabase, etc.).
 */

export type QuizOption = {
  id: string;
  englishText: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  /** Source VocabularyItem.id when generated from Vocabulary; optional for legacy snapshots. */
  vocabularyId?: string;
  /** Prompt shown to the learner (the Japanese meaning). Never used for grading English. */
  meaning: string;
  /** Original Japanese commentary, shown only as supplementary context. */
  japaneseText: string;
  /** The correct English commentary for this question. */
  correctText: string;
  learningPoint?: CommentaryLearningPoint;
  /** Exactly 4 options, shuffled, with a single correct one. */
  options: QuizOption[];
};

export type QuizAnswerResult = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
};

export type QuizSessionResult = {
  total: number;
  correct: number;
  incorrect: number;
  longestStreak: number;
  answers: QuizAnswerResult[];
  /** Questions the learner answered incorrectly, for review on the result screen. */
  missedQuestions: QuizQuestion[];
};
