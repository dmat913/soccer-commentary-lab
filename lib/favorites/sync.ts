import { localFavoritesRepository } from "@/lib/repositories/favorites.local";
import type { SupabaseFavoritesRepository } from "@/lib/repositories/favorites.supabase";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";

function getFavoritesSyncedKey(userId: string): string {
  return `favorites-synced-user-${userId}`;
}

export function isFavoritesSynced(userId: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return localStorage.getItem(getFavoritesSyncedKey(userId)) === "true";
}

function markFavoritesSynced(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getFavoritesSyncedKey(userId), "true");
}

export type SyncLocalFavoritesResult = {
  inserted: number;
  skipped: boolean;
};

/**
 * Merges localStorage favorites into Supabase for the given user.
 * Does not delete local or remote data. Dedupes by english text (`FavoriteTranslation.text`).
 * Sets the synced flag only after all inserts succeed.
 */
export async function syncLocalFavoritesToSupabase(
  userId: string,
  supabaseRepo: SupabaseFavoritesRepository
): Promise<SyncLocalFavoritesResult> {
  if (typeof window === "undefined") {
    return { inserted: 0, skipped: true };
  }

  if (isFavoritesSynced(userId)) {
    return { inserted: 0, skipped: true };
  }

  try {
    const localFavorites = localFavoritesRepository.getSnapshot();
    const remoteFavorites = await supabaseRepo.fetchAll();
    const remoteTexts = new Set(
      remoteFavorites.map((favorite) => favorite.text.trim()).filter(Boolean)
    );

    const toInsert = localFavorites.filter((favorite) => {
      const text = favorite.text.trim();
      return text.length > 0 && !remoteTexts.has(text);
    });

    for (const favorite of toInsert) {
      await supabaseRepo.insertFavorite(favorite);
    }

    await supabaseRepo.fetchAll();
    markFavoritesSynced(userId);

    return { inserted: toInsert.length, skipped: false };
  } catch (error) {
    logSupabaseRepositoryError(
      "[syncLocalFavoritesToSupabase] sync failed",
      error,
      {
        userId,
        tableName: "favorites",
        operation: "sync",
      }
    );
    throw error;
  }
}
