import type { SupabaseClient } from "@supabase/supabase-js";

import {
  applyVocabularyAnswer,
  DEFAULT_VOCABULARY_LEARNING_STATE,
  markVocabularyStillLearning,
  normalizeVocabularyLearningState,
} from "@/lib/vocabulary/learning";
import {
  formatSupabaseError,
  logSupabaseRepositoryError,
} from "@/lib/repositories/supabase-error";
import { createClient } from "@/lib/supabase/client";
import type { VocabularyRepository } from "@/lib/repositories/types";
import type {
  VocabularyAddEntry,
  VocabularyItem,
  VocabularyLearningState,
} from "@/types/vocabulary";

type VocabularyRow = {
  id: string;
  user_id: string;
  english_text: string;
  meaning: string;
  japanese_text: string;
  learning_point_text: string | null;
  learning_point_meaning: string | null;
  created_at: string;
  updated_at: string;
  status?: string | null;
  correct_streak?: number | null;
  last_reviewed_at?: string | null;
};

const SELECT_COLUMNS =
  "id, user_id, english_text, meaning, japanese_text, learning_point_text, learning_point_meaning, created_at, updated_at, status, correct_streak, last_reviewed_at";

const EMPTY_VOCABULARY: VocabularyItem[] = [];

// PostgreSQL unique_violation, raised by the (user_id, english_text) constraint.
const POSTGRES_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return formatSupabaseError(error).code === POSTGRES_UNIQUE_VIOLATION;
}

function mapRowToVocabularyItem(row: VocabularyRow): VocabularyItem | null {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  const learningPointText =
    typeof row.learning_point_text === "string"
      ? row.learning_point_text.trim()
      : "";

  const learning = normalizeVocabularyLearningState({
    status: row.status,
    correctStreak: row.correct_streak,
    lastReviewedAt: row.last_reviewed_at,
  });

  return {
    id: row.id,
    englishText: typeof row.english_text === "string" ? row.english_text : "",
    meaning: typeof row.meaning === "string" ? row.meaning : "",
    japaneseText: typeof row.japanese_text === "string" ? row.japanese_text : "",
    ...(learningPointText
      ? {
          learningPoint: {
            text: learningPointText,
            meaning:
              typeof row.learning_point_meaning === "string"
                ? row.learning_point_meaning.trim()
                : "",
          },
        }
      : {}),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    status: learning.status,
    correctStreak: learning.correctStreak,
    ...(learning.lastReviewedAt
      ? { lastReviewedAt: learning.lastReviewedAt }
      : {}),
  };
}

function learningStateToRow(state: VocabularyLearningState): {
  status: string;
  correct_streak: number;
  last_reviewed_at: string | null;
} {
  const normalized = normalizeVocabularyLearningState(state);
  return {
    status: normalized.status,
    correct_streak: normalized.correctStreak,
    last_reviewed_at: normalized.lastReviewedAt ?? null,
  };
}

export class SupabaseVocabularyRepository implements VocabularyRepository {
  private snapshot: VocabularyItem[] = EMPTY_VOCABULARY;
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

  getSnapshot(): VocabularyItem[] {
    return this.snapshot;
  }

  getServerSnapshot(): VocabularyItem[] {
    return EMPTY_VOCABULARY;
  }

  isSaved(englishText: string): boolean {
    const normalized = englishText.trim();
    if (!normalized) {
      return false;
    }

    return this.snapshot.some((item) => item.englishText.trim() === normalized);
  }

  load(): VocabularyItem[] {
    void this.fetchAll();
    return this.snapshot;
  }

  add(entry: VocabularyAddEntry): VocabularyItem[] {
    const englishText = entry.englishText.trim();

    if (!englishText) {
      return this.snapshot;
    }

    const alreadySaved = this.snapshot.some(
      (item) => item.englishText.trim() === englishText
    );

    if (alreadySaved) {
      return this.snapshot;
    }

    const learningPointText = entry.learningPoint?.text.trim() ?? "";
    const learningPointMeaning = entry.learningPoint?.meaning.trim() ?? "";

    void this.insertVocabularyItem({
      englishText,
      meaning: entry.meaning.trim(),
      japaneseText: entry.japaneseText.trim(),
      learningPointText,
      learningPointMeaning,
    });

    return this.snapshot;
  }

  remove(id: string): VocabularyItem[] {
    void this.deleteVocabularyItem(id);
    return this.snapshot;
  }

  applyAnswer(id: string, isCorrect: boolean): VocabularyItem[] {
    const item = this.snapshot.find((entry) => entry.id === id);
    if (!item) {
      return this.snapshot;
    }

    const nextLearning = applyVocabularyAnswer(item, isCorrect);
    void this.updateLearningState(id, nextLearning);
    return this.snapshot;
  }

  markStillLearning(id: string): VocabularyItem[] {
    const item = this.snapshot.find((entry) => entry.id === id);
    if (!item || item.status !== "mastered") {
      return this.snapshot;
    }

    const nextLearning = markVocabularyStillLearning(item);
    void this.updateLearningState(id, nextLearning);
    return this.snapshot;
  }

  async fetchAll(): Promise<VocabularyItem[]> {
    const { data, error } = await this.supabase
      .from("vocabulary_items")
      .select(SELECT_COLUMNS)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] fetchAll failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "select",
        }
      );
      // Preserve the existing snapshot; do not discard it on failure.
      return this.snapshot;
    }

    const items = (data ?? [])
      .map((row) => mapRowToVocabularyItem(row as VocabularyRow))
      .filter((item): item is VocabularyItem => item !== null);

    this.snapshot = items.length > 0 ? items : EMPTY_VOCABULARY;
    this.notifyListeners();

    return this.snapshot;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async insertVocabularyItem(fields: {
    englishText: string;
    meaning: string;
    japaneseText: string;
    learningPointText: string;
    learningPointMeaning: string;
  }): Promise<void> {
    const timestamp = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("vocabulary_items")
      .insert({
        user_id: this.userId,
        english_text: fields.englishText,
        meaning: fields.meaning,
        japanese_text: fields.japaneseText,
        learning_point_text: fields.learningPointText || null,
        learning_point_meaning: fields.learningPointText
          ? fields.learningPointMeaning || null
          : null,
        status: DEFAULT_VOCABULARY_LEARNING_STATE.status,
        correct_streak: DEFAULT_VOCABULARY_LEARNING_STATE.correctStreak,
        last_reviewed_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        // Another tab/device already saved this expression. Reconcile instead
        // of failing so the snapshot reflects the true remote state.
        await this.fetchAll();
        return;
      }

      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] insertVocabularyItem failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "insert",
        }
      );
      return;
    }

    const item = mapRowToVocabularyItem(data as VocabularyRow);
    if (item) {
      this.snapshot = [
        item,
        ...this.snapshot.filter((existing) => existing.id !== item.id),
      ];
      this.notifyListeners();
    }
  }

  /**
   * Inserts one item during the initial localStorage → Supabase sync,
   * preserving its original createdAt and learning state. Does not touch the
   * in-memory snapshot; the caller runs fetchAll() afterwards.
   */
  async insertForSync(item: {
    englishText: string;
    meaning: string;
    japaneseText: string;
    learningPoint?: { text: string; meaning: string };
    createdAt: string;
    status?: VocabularyItem["status"];
    correctStreak?: number;
    lastReviewedAt?: string;
  }): Promise<void> {
    const englishText = item.englishText.trim();
    if (!englishText) {
      return;
    }

    const learningPointText = item.learningPoint?.text.trim() ?? "";
    const learningPointMeaning = item.learningPoint?.meaning.trim() ?? "";
    const timestamp = item.createdAt || new Date().toISOString();
    const learning = learningStateToRow(
      normalizeVocabularyLearningState({
        status: item.status,
        correctStreak: item.correctStreak,
        lastReviewedAt: item.lastReviewedAt,
      })
    );

    const { error } = await this.supabase.from("vocabulary_items").insert({
      user_id: this.userId,
      english_text: englishText,
      meaning: item.meaning.trim(),
      japanese_text: item.japaneseText.trim(),
      learning_point_text: learningPointText || null,
      learning_point_meaning: learningPointText
        ? learningPointMeaning || null
        : null,
      status: learning.status,
      correct_streak: learning.correct_streak,
      last_reviewed_at: learning.last_reviewed_at,
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (error) {
      if (isUniqueViolation(error)) {
        return;
      }

      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] insertForSync failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "insert",
        }
      );
      throw error;
    }
  }

  /**
   * Updates learning fields during sync merge. Does not mutate the snapshot;
   * caller refreshes with fetchAll(). Throws on non-recoverable errors.
   */
  async updateLearningForSync(
    id: string,
    learning: VocabularyLearningState
  ): Promise<void> {
    const fields = learningStateToRow(learning);
    const timestamp = new Date().toISOString();

    const { error } = await this.supabase
      .from("vocabulary_items")
      .update({
        ...fields,
        updated_at: timestamp,
      })
      .eq("user_id", this.userId)
      .eq("id", id);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] updateLearningForSync failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "update",
          vocabularyId: id,
        }
      );
      throw error;
    }
  }

  private async updateLearningState(
    id: string,
    learning: VocabularyLearningState
  ): Promise<void> {
    const fields = learningStateToRow(learning);
    const timestamp = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("vocabulary_items")
      .update({
        ...fields,
        updated_at: timestamp,
      })
      .eq("user_id", this.userId)
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] updateLearningState failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "update",
          vocabularyId: id,
        }
      );
      // Do not commit a local-only learning change on failure.
      return;
    }

    const updated = mapRowToVocabularyItem(data as VocabularyRow);
    if (!updated) {
      return;
    }

    this.snapshot = this.snapshot.map((item) =>
      item.id === id ? updated : item
    );
    this.notifyListeners();
  }

  private async deleteVocabularyItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("vocabulary_items")
      .delete()
      .eq("user_id", this.userId)
      .eq("id", id);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseVocabularyRepository] deleteVocabularyItem failed",
        error,
        {
          userId: this.userId,
          tableName: "vocabulary_items",
          operation: "delete",
          vocabularyId: id,
        }
      );
      // Keep the item in the snapshot on failure.
      return;
    }

    this.snapshot = this.snapshot.filter((item) => item.id !== id);
    this.notifyListeners();
  }
}

export function createSupabaseVocabularyRepository(
  userId: string,
  supabase?: SupabaseClient
): SupabaseVocabularyRepository {
  return new SupabaseVocabularyRepository(userId, supabase ?? createClient());
}

export function isSupabaseVocabularyRepository(
  repository: VocabularyRepository
): repository is SupabaseVocabularyRepository {
  return repository instanceof SupabaseVocabularyRepository;
}
