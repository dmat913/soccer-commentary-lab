import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import type {
  FavoriteToggleEntry,
  FavoritesRepository,
} from "@/lib/repositories/types";
import type { FavoriteTranslation } from "@/types/favorite";

type FavoriteRow = {
  id: string;
  user_id: string;
  japanese_text: string;
  english_text: string;
  style: string | null;
  learning_point: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_FAVORITES: FavoriteTranslation[] = [];

function mapRowToFavorite(row: FavoriteRow): FavoriteTranslation {
  const learningPointText = row.learning_point?.trim() ?? "";

  return {
    id: row.id,
    japaneseText: row.japanese_text,
    text: row.english_text,
    meaning: "",
    ...(learningPointText
      ? {
          learningPoint: {
            text: learningPointText,
            meaning: "",
          },
        }
      : {}),
    createdAt: row.created_at,
  };
}

function mapFavoriteToRow(
  favorite: FavoriteTranslation,
  userId: string
): Omit<FavoriteRow, "updated_at"> & { updated_at: string } {
  const timestamp = favorite.createdAt;

  return {
    id: favorite.id,
    user_id: userId,
    japanese_text: favorite.japaneseText,
    english_text: favorite.text,
    style: null,
    learning_point: favorite.learningPoint?.text.trim() || null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class SupabaseFavoritesRepository implements FavoritesRepository {
  private snapshot: FavoriteTranslation[] = EMPTY_FAVORITES;
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

  getSnapshot(): FavoriteTranslation[] {
    return this.snapshot;
  }

  getServerSnapshot(): FavoriteTranslation[] {
    return EMPTY_FAVORITES;
  }

  isFavoriteText(text: string): boolean {
    return this.snapshot.some((favorite) => favorite.text === text);
  }

  toggleFavorite(entry: FavoriteToggleEntry): FavoriteTranslation[] {
    const existing = this.snapshot.find((favorite) => favorite.text === entry.text);

    if (existing) {
      const previousSnapshot = this.snapshot;
      this.snapshot = this.snapshot.filter(
        (favorite) => favorite.text !== entry.text
      );
      this.notifyListeners();
      void this.removeFavorite(existing.id, entry.text, previousSnapshot);
      return this.snapshot;
    }

    const newItem: FavoriteTranslation = {
      id: crypto.randomUUID(),
      japaneseText: entry.japaneseText,
      text: entry.text,
      meaning: entry.meaning,
      ...(entry.explanation ? { explanation: entry.explanation } : {}),
      learningPoint: entry.learningPoint,
      createdAt: new Date().toISOString(),
    };

    this.snapshot = [newItem, ...this.snapshot];
    this.notifyListeners();
    void this.addFavorite(newItem);
    return this.snapshot;
  }

  async fetchAll(): Promise<FavoriteTranslation[]> {
    const { data, error } = await this.supabase
      .from("favorites")
      .select(
        "id, user_id, japanese_text, english_text, style, learning_point, created_at, updated_at"
      )
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseFavoritesRepository] fetchAll failed",
        error,
        {
          userId: this.userId,
          tableName: "favorites",
          operation: "select",
        }
      );
      throw error;
    }

    const favorites = (data ?? []).map((row) =>
      mapRowToFavorite(row as FavoriteRow)
    );
    this.snapshot = favorites.length > 0 ? favorites : EMPTY_FAVORITES;
    this.notifyListeners();
    return this.snapshot;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Inserts a favorite row without touching the in-memory snapshot.
   * Used by initial localStorage → Supabase sync; call fetchAll() afterwards.
   */
  async insertFavorite(favorite: FavoriteTranslation): Promise<void> {
    const row = mapFavoriteToRow(favorite, this.userId);
    const { error } = await this.supabase.from("favorites").insert(row);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseFavoritesRepository] insertFavorite failed",
        error,
        {
          userId: this.userId,
          tableName: "favorites",
          operation: "insert",
          favoriteId: favorite.id,
        }
      );
      throw error;
    }
  }

  private async addFavorite(favorite: FavoriteTranslation): Promise<void> {
    const previousSnapshot = this.snapshot;

    try {
      await this.insertFavorite(favorite);
    } catch (error) {
      this.snapshot = previousSnapshot;
      this.notifyListeners();
      throw error;
    }
  }

  private async removeFavorite(
    id: string,
    englishText: string,
    previousSnapshot: FavoriteTranslation[]
  ): Promise<void> {
    const { error } = await this.supabase
      .from("favorites")
      .delete()
      .eq("user_id", this.userId)
      .eq("english_text", englishText);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseFavoritesRepository] removeFavorite failed",
        error,
        {
          userId: this.userId,
          tableName: "favorites",
          operation: "delete",
          favoriteId: id,
        }
      );
      this.snapshot = previousSnapshot;
      this.notifyListeners();
      throw error;
    }
  }
}

export function createSupabaseFavoritesRepository(
  userId: string,
  supabase?: SupabaseClient
): SupabaseFavoritesRepository {
  return new SupabaseFavoritesRepository(userId, supabase ?? createClient());
}

export function isSupabaseFavoritesRepository(
  repository: FavoritesRepository
): repository is SupabaseFavoritesRepository {
  return repository instanceof SupabaseFavoritesRepository;
}
