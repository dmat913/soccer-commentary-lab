import type { QuizQuestion } from "@/types/quiz";

/**
 * Session record for a single day's Daily Challenge, persisted to localStorage.
 *
 * Only the day's ~5 questions are snapshotted (via `questions`) so an
 * in-progress or completed Challenge keeps working even if the learner later
 * edits or deletes the source vocabulary. `questionVocabularyIds` keeps a
 * lightweight reference back to Vocabulary for future learning-history use;
 * the full vocabulary is never duplicated here.
 */

export type DailyChallengeStatus = "in_progress" | "completed";

export type DailyAnswer = {
  /** Matches the snapshotted QuizQuestion.id for this day's set. */
  questionId: string;
  /** Source Vocabulary id when resolvable, else null (e.g. later deleted). */
  vocabularyId: string | null;
  selectedOptionId: string;
  isCorrect: boolean;
};

export type DailyChallenge = {
  /** JST "YYYY-MM-DD"; the single source of truth for the day boundary. */
  challengeDate: string;
  status: DailyChallengeStatus;
  /** Frozen question snapshot for the day (stable order and options). */
  questions: QuizQuestion[];
  /** Parallel to `questions`; Vocabulary id per question or null. */
  questionVocabularyIds: (string | null)[];
  currentQuestionIndex: number;
  answers: DailyAnswer[];
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  longestStreak: number;
  startedAt: string;
  completedAt: string | null;
};

export type StartDailyChallengeInput = {
  challengeDate: string;
  questions: QuizQuestion[];
  questionVocabularyIds: (string | null)[];
};
