import type {
  VocabularyLearningState,
  VocabularyLearningStatus,
} from "@/types/vocabulary";

export const VOCABULARY_MASTERY_STREAK = 3;

export const DEFAULT_VOCABULARY_LEARNING_STATE: VocabularyLearningState = {
  status: "new",
  correctStreak: 0,
};

const LEARNING_STATUSES = new Set<VocabularyLearningStatus>([
  "new",
  "learning",
  "mastered",
]);

export function isVocabularyLearningStatus(
  value: unknown
): value is VocabularyLearningStatus {
  return (
    typeof value === "string" &&
    LEARNING_STATUSES.has(value as VocabularyLearningStatus)
  );
}

/**
 * Normalizes learning fields from raw/legacy payloads.
 * Invalid values fall back to new / 0 / omitted lastReviewedAt.
 */
export function normalizeVocabularyLearningState(
  value: unknown
): VocabularyLearningState {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_VOCABULARY_LEARNING_STATE };
  }

  const record = value as Record<string, unknown>;
  const status = isVocabularyLearningStatus(record.status)
    ? record.status
    : "new";

  const streakRaw = record.correctStreak;
  const correctStreak =
    typeof streakRaw === "number" &&
    Number.isFinite(streakRaw) &&
    streakRaw >= 0
      ? Math.floor(streakRaw)
      : 0;

  const reviewedRaw = record.lastReviewedAt;
  if (typeof reviewedRaw !== "string" || reviewedRaw.trim().length === 0) {
    return { status, correctStreak };
  }

  const reviewedAt = reviewedRaw.trim();
  if (Number.isNaN(Date.parse(reviewedAt))) {
    return { status, correctStreak };
  }

  return { status, correctStreak, lastReviewedAt: reviewedAt };
}

/**
 * Applies one quiz/daily answer to vocabulary learning state.
 * Pure: no I/O. Pass `reviewedAt` for deterministic tests.
 */
export function applyVocabularyAnswer(
  current: VocabularyLearningState,
  isCorrect: boolean,
  reviewedAt: string = new Date().toISOString()
): VocabularyLearningState {
  const normalized = normalizeVocabularyLearningState(current);

  if (isCorrect) {
    const correctStreak = normalized.correctStreak + 1;
    const status: VocabularyLearningStatus =
      correctStreak >= VOCABULARY_MASTERY_STREAK ? "mastered" : "learning";

    return {
      status,
      correctStreak,
      lastReviewedAt: reviewedAt,
    };
  }

  return {
    status: "learning",
    correctStreak: 0,
    lastReviewedAt: reviewedAt,
  };
}

/**
 * User action: demote a mastered item back into active learning.
 * No-op for `new` / `learning` (returns the normalized current state unchanged).
 */
export function markVocabularyStillLearning(
  current: VocabularyLearningState,
  reviewedAt: string = new Date().toISOString()
): VocabularyLearningState {
  const normalized = normalizeVocabularyLearningState(current);
  if (normalized.status !== "mastered") {
    return normalized;
  }

  return {
    status: "learning",
    correctStreak: 0,
    lastReviewedAt: reviewedAt,
  };
}

function reviewedAtTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Picks learning state for sync by lastReviewedAt (newer wins).
 * Does not prefer mastered by status strength alone.
 * Does not max correctStreak independently of the chosen side.
 */
export function mergeVocabularyLearningState(
  local: VocabularyLearningState,
  remote: VocabularyLearningState
): VocabularyLearningState {
  const localState = normalizeVocabularyLearningState(local);
  const remoteState = normalizeVocabularyLearningState(remote);
  const localTime = reviewedAtTimestamp(localState.lastReviewedAt);
  const remoteTime = reviewedAtTimestamp(remoteState.lastReviewedAt);

  if (localTime !== null && remoteTime !== null) {
    if (localTime > remoteTime) {
      return localState;
    }
    if (remoteTime > localTime) {
      return remoteState;
    }
    // Equal timestamps: keep remote (body-content remote-preference policy).
    return remoteState;
  }

  if (localTime !== null) {
    return localState;
  }

  if (remoteTime !== null) {
    return remoteState;
  }

  return remoteState;
}

export function vocabularyLearningStatesEqual(
  a: VocabularyLearningState,
  b: VocabularyLearningState
): boolean {
  const left = normalizeVocabularyLearningState(a);
  const right = normalizeVocabularyLearningState(b);
  return (
    left.status === right.status &&
    left.correctStreak === right.correctStreak &&
    (left.lastReviewedAt ?? undefined) === (right.lastReviewedAt ?? undefined)
  );
}
