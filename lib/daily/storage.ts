import { getJstDayKey } from "@/lib/daily/day-key";
import type {
  DailyAnswer,
  DailyChallenge,
  StartDailyChallengeInput,
} from "@/types/daily-challenge";
import type { QuizOption, QuizQuestion } from "@/types/quiz";

const STORAGE_KEY = "daily-challenge";

const dailyListeners = new Set<() => void>();

// Single cached record for the current tab. `cacheLoaded` distinguishes
// "not read yet" from "read and empty" so we only touch localStorage once.
let cachedRecord: DailyChallenge | null = null;
let cacheLoaded = false;

function notifyDailyListeners(): void {
  for (const listener of dailyListeners) {
    listener();
  }
}

export function subscribeDailyChallenge(listener: () => void): () => void {
  dailyListeners.add(listener);
  return () => {
    dailyListeners.delete(listener);
  };
}

function isQuizOption(value: unknown): value is QuizOption {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const option = value as Record<string, unknown>;
  return (
    typeof option.id === "string" &&
    typeof option.englishText === "string" &&
    typeof option.isCorrect === "boolean"
  );
}

function isLearningPoint(
  value: unknown
): value is { text: string; meaning: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const point = value as Record<string, unknown>;
  return typeof point.text === "string" && typeof point.meaning === "string";
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const question = value as Record<string, unknown>;
  const hasLearningPoint =
    question.learningPoint === undefined ||
    isLearningPoint(question.learningPoint);
  return (
    typeof question.id === "string" &&
    typeof question.meaning === "string" &&
    typeof question.japaneseText === "string" &&
    typeof question.correctText === "string" &&
    Array.isArray(question.options) &&
    question.options.length > 0 &&
    question.options.every(isQuizOption) &&
    hasLearningPoint
  );
}

function isDailyAnswer(value: unknown): value is DailyAnswer {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const answer = value as Record<string, unknown>;
  return (
    typeof answer.questionId === "string" &&
    (answer.vocabularyId === null || typeof answer.vocabularyId === "string") &&
    typeof answer.selectedOptionId === "string" &&
    typeof answer.isCorrect === "boolean"
  );
}

function isDailyChallenge(value: unknown): value is DailyChallenge {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const status = record.status;
  const statusValid: boolean =
    status === "in_progress" || status === "completed";

  return (
    typeof record.challengeDate === "string" &&
    statusValid &&
    Array.isArray(record.questions) &&
    record.questions.length > 0 &&
    record.questions.every(isQuizQuestion) &&
    Array.isArray(record.questionVocabularyIds) &&
    record.questionVocabularyIds.every(
      (id) => id === null || typeof id === "string"
    ) &&
    typeof record.currentQuestionIndex === "number" &&
    Array.isArray(record.answers) &&
    record.answers.every(isDailyAnswer) &&
    typeof record.correctCount === "number" &&
    typeof record.incorrectCount === "number" &&
    typeof record.currentStreak === "number" &&
    typeof record.longestStreak === "number" &&
    typeof record.startedAt === "string" &&
    (record.completedAt === null || typeof record.completedAt === "string")
  );
}

function readFromStorage(): DailyChallenge | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isDailyChallenge(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadCache(): DailyChallenge | null {
  if (!cacheLoaded) {
    cachedRecord = readFromStorage();
    cacheLoaded = true;
  }
  return cachedRecord;
}

/**
 * Today's record, or null. A record from a previous JST day is never returned
 * as today's Challenge (it is treated as absent), so a new day always starts
 * fresh. Read-only: never writes to localStorage.
 */
export function getDailyChallengeSnapshot(): DailyChallenge | null {
  const record = loadCache();
  if (!record) {
    return null;
  }
  return record.challengeDate === getJstDayKey() ? record : null;
}

/** Stable value for SSR / hydration: the record is client-only. */
export function getServerDailyChallengeSnapshot(): DailyChallenge | null {
  return null;
}

function persist(record: DailyChallenge): void {
  cachedRecord = record;
  cacheLoaded = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Quota / private mode: keep the in-memory record so the tab stays
      // consistent for the rest of the session.
    }
  }
  notifyDailyListeners();
}

/** Removes the stored record (used to invalidate stale, previous-day data). */
export function clearDailyChallenge(): void {
  cachedRecord = null;
  cacheLoaded = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore; the in-memory cache is already cleared.
    }
  }
  notifyDailyListeners();
}

/**
 * Drops a persisted record that belongs to a previous JST day. Safe to call on
 * mount; only writes (and notifies) when stale data actually exists, so it does
 * not accumulate history or trigger needless renders.
 */
export function invalidateStaleDailyChallenge(): void {
  if (typeof window === "undefined") {
    return;
  }
  const record = loadCache();
  if (record && record.challengeDate !== getJstDayKey()) {
    clearDailyChallenge();
  }
}

/**
 * Creates today's record once. If a record for today already exists (in
 * progress or completed) it is returned unchanged, so reloads and Strict Mode
 * never regenerate the day's questions.
 */
export function startDailyChallenge(
  input: StartDailyChallengeInput
): DailyChallenge {
  const existing = getDailyChallengeSnapshot();
  if (existing) {
    return existing;
  }

  const record: DailyChallenge = {
    challengeDate: input.challengeDate,
    status: "in_progress",
    questions: input.questions,
    questionVocabularyIds: input.questionVocabularyIds,
    currentQuestionIndex: 0,
    answers: [],
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  persist(record);
  return record;
}

/**
 * Records the answer for the current question. No-ops if there is no active
 * record or the current question was already answered, preventing double
 * counting on repeated taps.
 */
export function answerDailyQuestion(optionId: string): void {
  const record = getDailyChallengeSnapshot();
  if (!record || record.status !== "in_progress") {
    return;
  }

  const question = record.questions[record.currentQuestionIndex];
  if (!question) {
    return;
  }
  const alreadyAnswered = record.answers.some(
    (answer) => answer.questionId === question.id
  );
  if (alreadyAnswered) {
    return;
  }

  const option = question.options.find((candidate) => candidate.id === optionId);
  if (!option) {
    return;
  }

  const isCorrect = option.isCorrect;
  const currentStreak = isCorrect ? record.currentStreak + 1 : 0;
  const vocabularyId =
    record.questionVocabularyIds[record.currentQuestionIndex] ?? null;

  persist({
    ...record,
    answers: [
      ...record.answers,
      {
        questionId: question.id,
        vocabularyId,
        selectedOptionId: optionId,
        isCorrect,
      },
    ],
    correctCount: record.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: record.incorrectCount + (isCorrect ? 0 : 1),
    currentStreak,
    longestStreak: Math.max(record.longestStreak, currentStreak),
  });
}

/**
 * Advances to the next question, or completes the Challenge after the last
 * one. No-ops if the current question has not been answered, preventing an
 * accidental double advance. A completed record is never overwritten.
 */
export function advanceDailyChallenge(): void {
  const record = getDailyChallengeSnapshot();
  if (!record || record.status !== "in_progress") {
    return;
  }

  const question = record.questions[record.currentQuestionIndex];
  if (!question) {
    return;
  }
  const answered = record.answers.some(
    (answer) => answer.questionId === question.id
  );
  if (!answered) {
    return;
  }

  const nextIndex = record.currentQuestionIndex + 1;
  if (nextIndex >= record.questions.length) {
    persist({
      ...record,
      status: "completed",
      completedAt: new Date().toISOString(),
    });
    return;
  }

  persist({ ...record, currentQuestionIndex: nextIndex });
}
