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
  enriched: number;
  skipped: boolean;
};

/**
 * Merges localStorage favorites into Supabase for the given user.
 * - Inserts rows missing by english text (never duplicates).
 * - When remote exists but content fields are empty and local has values, fills those fields only.
 * - Does not overwrite non-empty remote values.
 * - Sets the synced flag only after inserts/enrichment succeed.
 *
 * Already-synced users still run enrichment (and missing inserts) so older
 * remote rows can receive meaning / explanation / learning-point meaning.
 */
export async function syncLocalFavoritesToSupabase(
  userId: string,
  supabaseRepo: SupabaseFavoritesRepository
): Promise<SyncLocalFavoritesResult> {
  if (typeof window === "undefined") {
    return { inserted: 0, enriched: 0, skipped: true };
  }

  try {
    const localFavorites = localFavoritesRepository.getSnapshot();
    const remoteFavorites = await supabaseRepo.fetchAll();
    const remoteByText = new Map(
      remoteFavorites
        .map((favorite) => [favorite.text.trim(), favorite] as const)
        .filter(([text]) => text.length > 0)
    );

    let inserted = 0;
    let enriched = 0;

    for (const favorite of localFavorites) {
      const text = favorite.text.trim();
      if (!text) {
        continue;
      }

      const remote = remoteByText.get(text);
      if (!remote) {
        await supabaseRepo.insertFavorite(favorite);
        inserted += 1;
        continue;
      }

      const didEnrich = await supabaseRepo.enrichFavoriteFromLocal(
        remote,
        favorite
      );
      if (didEnrich) {
        enriched += 1;
      }
    }

    await supabaseRepo.fetchAll();
    markFavoritesSynced(userId);

    return { inserted, enriched, skipped: false };
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
