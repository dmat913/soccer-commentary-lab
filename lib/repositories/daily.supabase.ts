import type { SupabaseClient } from "@supabase/supabase-js";

import { getJstDayKey } from "@/lib/daily/day-key";
import {
  formatSupabaseError,
  logSupabaseRepositoryError,
} from "@/lib/repositories/supabase-error";
import type { DailyChallengeRepository } from "@/lib/repositories/types";
import { createClient } from "@/lib/supabase/client";
import type {
  DailyAnswer,
  DailyChallenge,
  DailyChallengeStatus,
  StartDailyChallengeInput,
} from "@/types/daily-challenge";
import type { QuizOption, QuizQuestion } from "@/types/quiz";

type DailyChallengeRow = {
  id: string;
  user_id: string;
  challenge_date: string;
  status: string;
  questions: unknown;
  question_vocabulary_ids: unknown;
  current_question_index: number;
  answers: unknown;
  correct_count: number;
  incorrect_count: number;
  current_streak: number;
  longest_streak: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS =
  "id, user_id, challenge_date, status, questions, question_vocabulary_ids, current_question_index, answers, correct_count, incorrect_count, current_streak, longest_streak, started_at, completed_at, created_at, updated_at";

const TABLE_NAME = "daily_challenges";

// PostgreSQL unique_violation — raised by (user_id, challenge_date).
const POSTGRES_UNIQUE_VIOLATION = "23505";

const SERVER_SNAPSHOT: DailyChallenge | null = null;

function isUniqueViolation(error: unknown): boolean {
  return formatSupabaseError(error).code === POSTGRES_UNIQUE_VIOLATION;
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

function isDailyChallengeStatus(value: unknown): value is DailyChallengeStatus {
  return value === "in_progress" || value === "completed";
}

function parseQuestions(value: unknown): QuizQuestion[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  if (!value.every(isQuizQuestion)) {
    return null;
  }
  return value;
}

function parseQuestionVocabularyIds(value: unknown): (string | null)[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  if (!value.every((id) => id === null || typeof id === "string")) {
    return null;
  }
  return value;
}

function parseAnswers(value: unknown): DailyAnswer[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  if (!value.every(isDailyAnswer)) {
    return null;
  }
  return value;
}

/**
 * Maps a Supabase row to the shared DailyChallenge type. Returns null when the
 * row is incomplete or jsonb payloads fail the type guards.
 */
function mapRowToDailyChallenge(row: DailyChallengeRow): DailyChallenge | null {
  if (!row || typeof row.challenge_date !== "string") {
    return null;
  }
  if (!isDailyChallengeStatus(row.status)) {
    return null;
  }

  const questions = parseQuestions(row.questions);
  const questionVocabularyIds = parseQuestionVocabularyIds(
    row.question_vocabulary_ids
  );
  const answers = parseAnswers(row.answers);

  if (!questions || !questionVocabularyIds || !answers) {
    return null;
  }

  if (
    typeof row.current_question_index !== "number" ||
    typeof row.correct_count !== "number" ||
    typeof row.incorrect_count !== "number" ||
    typeof row.current_streak !== "number" ||
    typeof row.longest_streak !== "number" ||
    typeof row.started_at !== "string"
  ) {
    return null;
  }

  if (
    row.completed_at !== null &&
    typeof row.completed_at !== "string"
  ) {
    return null;
  }

  return {
    challengeDate: row.challenge_date,
    status: row.status,
    questions,
    questionVocabularyIds,
    currentQuestionIndex: row.current_question_index,
    answers,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function buildStartRecord(input: StartDailyChallengeInput): DailyChallenge {
  return {
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
}

function toInsertPayload(
  userId: string,
  record: DailyChallenge,
  updatedAt: string
): Record<string, unknown> {
  return {
    user_id: userId,
    challenge_date: record.challengeDate,
    status: record.status,
    questions: record.questions,
    question_vocabulary_ids: record.questionVocabularyIds,
    current_question_index: record.currentQuestionIndex,
    answers: record.answers,
    correct_count: record.correctCount,
    incorrect_count: record.incorrectCount,
    current_streak: record.currentStreak,
    longest_streak: record.longestStreak,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    updated_at: updatedAt,
  };
}

function toUpdatePayload(
  record: DailyChallenge,
  updatedAt: string
): Record<string, unknown> {
  return {
    status: record.status,
    questions: record.questions,
    question_vocabulary_ids: record.questionVocabularyIds,
    current_question_index: record.currentQuestionIndex,
    answers: record.answers,
    correct_count: record.correctCount,
    incorrect_count: record.incorrectCount,
    current_streak: record.currentStreak,
    longest_streak: record.longestStreak,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    updated_at: updatedAt,
  };
}

export class SupabaseDailyChallengeRepository
  implements DailyChallengeRepository
{
  private snapshot: DailyChallenge | null = null;
  /** Tracks an in-flight insert so concurrent start/answer do not double-write. */
  private startPromise: Promise<void> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly userId: string,
    private readonly supabase: SupabaseClient = createClient()
  ) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): DailyChallenge | null {
    return this.snapshot;
  }

  getServerSnapshot(): DailyChallenge | null {
    return SERVER_SNAPSHOT;
  }

  /**
   * Starts today's Challenge. Returns the existing snapshot when already
   * present. Otherwise creates a provisional snapshot and inserts remotely;
   * unique-constraint races reconcile via fetchToday.
   */
  start(input: StartDailyChallengeInput): DailyChallenge {
    if (
      this.snapshot &&
      this.snapshot.challengeDate === input.challengeDate
    ) {
      return this.snapshot;
    }

    const record = buildStartRecord(input);
    this.setSnapshot(record);
    this.startPromise = this.insertChallenge(record).finally(() => {
      this.startPromise = null;
    });
    return record;
  }

  answer(optionId: string): void {
    const record = this.snapshot;
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

    const option = question.options.find(
      (candidate) => candidate.id === optionId
    );
    if (!option) {
      return;
    }

    const isCorrect = option.isCorrect;
    const currentStreak = isCorrect ? record.currentStreak + 1 : 0;
    const vocabularyId =
      record.questionVocabularyIds[record.currentQuestionIndex] ?? null;

    const previous = record;
    const next: DailyChallenge = {
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
    };

    this.setSnapshot(next);
    void this.persistUpdate(next, previous);
  }

  advance(): void {
    const record = this.snapshot;
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

    const previous = record;
    const nextIndex = record.currentQuestionIndex + 1;
    const next: DailyChallenge =
      nextIndex >= record.questions.length
        ? {
            ...record,
            status: "completed",
            completedAt: new Date().toISOString(),
          }
        : {
            ...record,
            currentQuestionIndex: nextIndex,
          };

    this.setSnapshot(next);
    void this.persistUpdate(next, previous);
  }

  /**
   * Drops a previous-day in-memory snapshot. Does not DELETE remote history —
   * previous days stay in Supabase for future learning stats.
   */
  invalidateStale(): void {
    if (this.snapshot && this.snapshot.challengeDate !== getJstDayKey()) {
      this.setSnapshot(null);
    }
  }

  clear(): void {
    void this.deleteToday();
  }

  /**
   * Loads the Challenge for the given JST date key (typically today). On
   * success updates the snapshot; on error preserves the existing snapshot.
   */
  async fetchToday(challengeDate: string): Promise<DailyChallenge | null> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select(SELECT_COLUMNS)
      .eq("user_id", this.userId)
      .eq("challenge_date", challengeDate)
      .maybeSingle();

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] fetchToday failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "select",
        }
      );
      return this.snapshot;
    }

    if (!data) {
      this.setSnapshot(null);
      return null;
    }

    const mapped = mapRowToDailyChallenge(data as DailyChallengeRow);
    this.setSnapshot(mapped);
    return mapped;
  }

  /**
   * Inserts a complete DailyChallenge during local→remote sync. Does not
   * mutate the in-memory snapshot; the caller runs fetchToday afterwards.
   * Unique violations (already exists) are treated as done (no throw) so the
   * caller can re-fetch and re-apply conflict rules.
   */
  async insertForSync(record: DailyChallenge): Promise<void> {
    const timestamp = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .insert(toInsertPayload(this.userId, record, timestamp));

    if (error) {
      if (isUniqueViolation(error)) {
        return;
      }

      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] insertForSync failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "insert",
        }
      );
      throw error;
    }
  }

  /**
   * Overwrites an in-progress remote row with the given record during sync.
   * Does not mutate the in-memory snapshot; the caller runs fetchToday after.
   * A zero-row UPDATE (remote already completed / missing) is a successful no-op
   * so completed remotes are never overwritten.
   */
  async updateInProgressForSync(record: DailyChallenge): Promise<void> {
    const timestamp = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .update(toUpdatePayload(record, timestamp))
      .eq("user_id", this.userId)
      .eq("challenge_date", record.challengeDate)
      .eq("status", "in_progress");

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] updateInProgressForSync failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "update",
        }
      );
      throw error;
    }
  }

  private setSnapshot(next: DailyChallenge | null): void {
    if (this.snapshot === next) {
      return;
    }
    this.snapshot = next;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async insertChallenge(record: DailyChallenge): Promise<void> {
    const timestamp = new Date().toISOString();
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(toInsertPayload(this.userId, record, timestamp))
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        const localProgress = this.snapshot;
        await this.fetchToday(record.challengeDate);
        const remote = this.snapshot;
        if (
          localProgress &&
          remote &&
          localProgress.challengeDate === remote.challengeDate &&
          (localProgress.answers.length > remote.answers.length ||
            localProgress.currentQuestionIndex >
              remote.currentQuestionIndex ||
            (localProgress.status === "completed" &&
              remote.status !== "completed"))
        ) {
          const merged: DailyChallenge = {
            ...localProgress,
            startedAt: remote.startedAt,
          };
          this.setSnapshot(merged);
          await this.writeUpdate(merged, remote);
        }
        return;
      }

      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] insertChallenge failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "insert",
        }
      );
      // Roll back only when nothing progressed beyond the provisional start.
      if (
        this.snapshot &&
        this.snapshot.challengeDate === record.challengeDate &&
        this.snapshot.status === "in_progress" &&
        this.snapshot.answers.length === 0 &&
        this.snapshot.currentQuestionIndex === 0
      ) {
        this.setSnapshot(null);
      }
      return;
    }

    const mapped = mapRowToDailyChallenge(data as DailyChallengeRow);
    if (!mapped) {
      return;
    }

    const current = this.snapshot;
    const progressedBeyondStart =
      current !== null &&
      current.challengeDate === mapped.challengeDate &&
      (current.answers.length > 0 ||
        current.currentQuestionIndex > 0 ||
        current.status === "completed");

    if (progressedBeyondStart && current) {
      // Keep in-flight answers; adopt server timestamps from the insert.
      const merged: DailyChallenge = {
        ...current,
        startedAt: mapped.startedAt,
      };
      this.setSnapshot(merged);
      await this.writeUpdate(merged, mapped);
      return;
    }

    this.setSnapshot(mapped);
  }

  private async persistUpdate(
    next: DailyChallenge,
    previous: DailyChallenge
  ): Promise<void> {
    if (this.startPromise) {
      await this.startPromise;
    }

    // After start reconcile, another tab may already be ahead or completed.
    if (!this.snapshot || this.snapshot.challengeDate !== next.challengeDate) {
      await this.fetchToday(next.challengeDate);
      return;
    }
    if (this.snapshot.status === "completed" && next.status !== "completed") {
      return;
    }
    if (this.snapshot.answers.length > next.answers.length) {
      return;
    }

    await this.writeUpdate(next, previous);
  }

  private async writeUpdate(
    next: DailyChallenge,
    previous: DailyChallenge
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(toUpdatePayload(next, timestamp))
      .eq("user_id", this.userId)
      .eq("challenge_date", next.challengeDate)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] persistUpdate failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "update",
        }
      );
      this.setSnapshot(previous);
      return;
    }

    if (!data) {
      this.setSnapshot(previous);
      await this.fetchToday(next.challengeDate);
      return;
    }

    const mapped = mapRowToDailyChallenge(data as DailyChallengeRow);
    if (mapped) {
      this.setSnapshot(mapped);
    } else {
      this.setSnapshot(previous);
    }
  }

  private async deleteToday(): Promise<void> {
    const challengeDate = this.snapshot?.challengeDate ?? getJstDayKey();

    const { error } = await this.supabase
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", this.userId)
      .eq("challenge_date", challengeDate);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDailyChallengeRepository] deleteToday failed",
        error,
        {
          userId: this.userId,
          tableName: TABLE_NAME,
          operation: "delete",
        }
      );
      return;
    }

    this.setSnapshot(null);
  }
}

export function createSupabaseDailyChallengeRepository(
  userId: string,
  supabase?: SupabaseClient
): SupabaseDailyChallengeRepository {
  return new SupabaseDailyChallengeRepository(
    userId,
    supabase ?? createClient()
  );
}

export function isSupabaseDailyChallengeRepository(
  repository: DailyChallengeRepository
): repository is SupabaseDailyChallengeRepository {
  return repository instanceof SupabaseDailyChallengeRepository;
}
