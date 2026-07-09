"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { syncLocalFavoritesToSupabase } from "@/lib/favorites/sync";
import { getFavoritesRepository } from "@/lib/repositories";
import { isSupabaseFavoritesRepository } from "@/lib/repositories/favorites.supabase";
import type { FavoriteToggleEntry } from "@/lib/repositories/types";
import type { FavoriteTranslation } from "@/types/favorite";

export function useFavoriteTranslations(): FavoriteTranslation[] {
  const { user } = useAuth();
  const repository = useMemo(
    () => getFavoritesRepository(user?.id ?? null),
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id || !isSupabaseFavoritesRepository(repository)) {
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;

    async function loadFavorites() {
      try {
        await syncLocalFavoritesToSupabase(userId, supabaseRepo);
      } catch {
        // Sync errors are logged inside syncLocalFavoritesToSupabase.
        // Do not set the synced flag; still try to load remote favorites.
      }

      if (cancelled) {
        return;
      }

      try {
        await supabaseRepo.fetchAll();
      } catch {
        // fetchAll logs its own error details.
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [user?.id, repository]);

  return useSyncExternalStore(
    repository.subscribe.bind(repository),
    repository.getSnapshot.bind(repository),
    repository.getServerSnapshot.bind(repository)
  );
}

export function toggleFavorite(
  entry: FavoriteToggleEntry,
  userId?: string | null
): FavoriteTranslation[] {
  return getFavoritesRepository(userId ?? null).toggleFavorite(entry);
}
