import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveLearningPoint } from "@/lib/commentary/learning-point";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import { createClient } from "@/lib/supabase/client";
import type { CommentaryTranslationItem } from "@/types/commentary";
import type { CommentaryHistoryItem, StoredHistoryTranslation } from "@/types/history";
import type { HistoryAddEntry, HistoryRepository } from "./types";

type CommentaryHistoryRow = {
  id: string;
  user_id: string;
  japanese_text: string;
  candidates: StoredHistoryTranslation[];
  created_at: string;
  updated_at: string;
};

type CommentaryHistoryInsertRow = Omit<CommentaryHistoryRow, "id">;

const EMPTY_HISTORY: CommentaryHistoryItem[] = [];

function isStoredHistoryTranslation(
  value: unknown
): value is StoredHistoryTranslation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  const learningPoint = item.learningPoint;
  const vocabulary = item.vocabulary;

  const hasLearningPoint =
    learningPoint === undefined ||
    (typeof learningPoint === "object" &&
      learningPoint !== null &&
      typeof (learningPoint as Record<string, unknown>).text === "string" &&
      typeof (learningPoint as Record<string, unknown>).meaning === "string");

  const hasLegacyVocabulary =
    vocabulary === undefined ||
    (typeof vocabulary === "object" &&
      vocabulary !== null &&
      typeof (vocabulary as Record<string, unknown>).word === "string" &&
      typeof (vocabulary as Record<string, unknown>).meaning === "string");

  return (
    typeof item.text === "string" &&
    typeof item.meaning === "string" &&
    (item.explanation === undefined || typeof item.explanation === "string") &&
    hasLearningPoint &&
    hasLegacyVocabulary
  );
}

function normalizeCandidate(
  raw: StoredHistoryTranslation
): CommentaryTranslationItem | null {
  const text = raw.text.trim();
  const meaning = raw.meaning.trim();

  if (!text || !meaning) {
    return null;
  }

  return {
    text,
    meaning,
    explanation: raw.explanation?.trim() ?? "",
    learningPoint: resolveLearningPoint({
      learningPoint: raw.learningPoint,
      vocabulary: raw.vocabulary,
    }),
  };
}

function mapRowToHistoryItem(row: CommentaryHistoryRow): CommentaryHistoryItem | null {
  const translations = row.candidates
    .filter(isStoredHistoryTranslation)
    .map(normalizeCandidate)
    .filter((candidate): candidate is CommentaryTranslationItem => {
      return candidate !== null;
    });

  if (translations.length === 0) {
    return null;
  }

  return {
    id: row.id,
    japaneseText: row.japanese_text,
    translations,
    savedAt: row.created_at,
  };
}

function mapHistoryItemToInsertRow(
  item: CommentaryHistoryItem,
  userId: string
): CommentaryHistoryInsertRow {
  return {
    user_id: userId,
    japanese_text: item.japaneseText,
    candidates: item.translations,
    created_at: item.savedAt,
    updated_at: item.savedAt,
  };
}

export class SupabaseHistoryRepository implements HistoryRepository {
  private snapshot: CommentaryHistoryItem[] = EMPTY_HISTORY;
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

  getSnapshot(): CommentaryHistoryItem[] {
    return this.snapshot;
  }

  getServerSnapshot(): CommentaryHistoryItem[] {
    return EMPTY_HISTORY;
  }

  load(): CommentaryHistoryItem[] {
    return this.getSnapshot();
  }

  add(entry: HistoryAddEntry): CommentaryHistoryItem[] {
    return this.addHistory(entry);
  }

  remove(id: string): CommentaryHistoryItem[] {
    void this.removeHistory(id);
    return this.getSnapshot();
  }

  addHistory(entry: HistoryAddEntry): CommentaryHistoryItem[] {
    // Optimistic client id until DB assigns gen_random_uuid() on insert.
    const newItem: CommentaryHistoryItem = {
      id: crypto.randomUUID(),
      japaneseText: entry.japaneseText,
      translations: entry.translations,
      savedAt: new Date().toISOString(),
    };
    const previousSnapshot = this.snapshot;

    this.snapshot = [newItem, ...this.snapshot];
    this.notifyListeners();
    void this.insertHistory(newItem, previousSnapshot);

    return this.snapshot;
  }

  async fetchAll(): Promise<CommentaryHistoryItem[]> {
    const { data, error } = await this.supabase
      .from("commentary_history")
      .select("id, user_id, japanese_text, candidates, created_at, updated_at")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseHistoryRepository] fetchAll failed",
        error,
        {
          userId: this.userId,
          tableName: "commentary_history",
          operation: "select",
        }
      );
      throw error;
    }

    const history = (data ?? [])
      .map((row) => mapRowToHistoryItem(row as CommentaryHistoryRow))
      .filter((item): item is CommentaryHistoryItem => item !== null);

    this.snapshot = history.length > 0 ? history : EMPTY_HISTORY;
    this.notifyListeners();

    return this.snapshot;
  }

  async removeHistory(id: string): Promise<void> {
    const previousSnapshot = this.snapshot;
    this.snapshot = this.snapshot.filter((item) => item.id !== id);
    this.notifyListeners();

    const { error } = await this.supabase
      .from("commentary_history")
      .delete()
      .eq("user_id", this.userId)
      .eq("id", id);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseHistoryRepository] removeHistory failed",
        error,
        {
          userId: this.userId,
          tableName: "commentary_history",
          operation: "delete",
          historyId: id,
        }
      );
      this.snapshot = previousSnapshot;
      this.notifyListeners();
      throw error;
    }
  }

  async clearHistory(): Promise<void> {
    const previousSnapshot = this.snapshot;
    this.snapshot = EMPTY_HISTORY;
    this.notifyListeners();

    const { error } = await this.supabase
      .from("commentary_history")
      .delete()
      .eq("user_id", this.userId);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseHistoryRepository] clearHistory failed",
        error,
        {
          userId: this.userId,
          tableName: "commentary_history",
          operation: "delete_all",
        }
      );
      this.snapshot = previousSnapshot;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Inserts a history row without touching the in-memory snapshot.
   * Used by initial localStorage → Supabase sync; call fetchAll() afterwards.
   */
  async insertHistoryItem(item: CommentaryHistoryItem): Promise<void> {
    const { error } = await this.supabase
      .from("commentary_history")
      .insert(mapHistoryItemToInsertRow(item, this.userId));

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseHistoryRepository] insertHistoryItem failed",
        error,
        {
          userId: this.userId,
          tableName: "commentary_history",
          operation: "insert",
        }
      );
      throw error;
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async insertHistory(
    item: CommentaryHistoryItem,
    previousSnapshot: CommentaryHistoryItem[]
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from("commentary_history")
      .insert(mapHistoryItemToInsertRow(item, this.userId))
      .select("id, user_id, japanese_text, candidates, created_at, updated_at")
      .single();

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseHistoryRepository] insertHistory failed",
        error,
        {
          userId: this.userId,
          tableName: "commentary_history",
          operation: "insert",
        }
      );
      this.snapshot = previousSnapshot;
      this.notifyListeners();
      throw error;
    }

    const persisted = mapRowToHistoryItem(data as CommentaryHistoryRow);
    if (persisted) {
      this.snapshot = this.snapshot.map((historyItem) =>
        historyItem.id === item.id ? persisted : historyItem
      );
      this.notifyListeners();
    }
  }
}

export function createSupabaseHistoryRepository(
  userId: string,
  supabase?: SupabaseClient
): SupabaseHistoryRepository {
  return new SupabaseHistoryRepository(userId, supabase ?? createClient());
}

export function isSupabaseHistoryRepository(
  repository: HistoryRepository
): repository is SupabaseHistoryRepository {
  return repository instanceof SupabaseHistoryRepository;
}
