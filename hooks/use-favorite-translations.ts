"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { syncLocalFavoritesToSupabase } from "@/lib/favorites/sync";
import { getFavoritesRepository } from "@/lib/repositories";
import { isSupabaseFavoritesRepository } from "@/lib/repositories/favorites.supabase";
import type { FavoriteToggleEntry } from "@/lib/repositories/types";
import type { FavoriteTranslation } from "@/types/favorite";

const remoteLoadingListeners = new Set<() => void>();
let remoteFavoritesLoading = false;
const completedRemoteFavoriteLoads = new Set<string>();

function setRemoteFavoritesLoading(next: boolean) {
  if (remoteFavoritesLoading === next) {
    return;
  }
  remoteFavoritesLoading = next;
  for (const listener of remoteLoadingListeners) {
    listener();
  }
}

function markRemoteFavoritesLoadComplete(userId: string) {
  completedRemoteFavoriteLoads.add(userId);
  remoteFavoritesLoading = false;
  for (const listener of remoteLoadingListeners) {
    listener();
  }
}

function subscribeRemoteFavoritesLoading(listener: () => void) {
  remoteLoadingListeners.add(listener);
  return () => {
    remoteLoadingListeners.delete(listener);
  };
}

/**
 * True while auth is unresolved or a signed-in remote favorites fetch is in flight.
 * Used to avoid flashing the empty state before sync completes.
 */
export function useFavoriteTranslationsLoading(): boolean {
  const { user, isLoading: authLoading } = useAuth();
  const remoteLoading = useSyncExternalStore(
    subscribeRemoteFavoritesLoading,
    () => remoteFavoritesLoading,
    () => true
  );

  if (authLoading) {
    return true;
  }
  if (user?.id) {
    if (!completedRemoteFavoriteLoads.has(user.id)) {
      return true;
    }
    return remoteLoading;
  }
  return false;
}

export function useFavoriteTranslations(): FavoriteTranslation[] {
  const { user } = useAuth();
  const repository = useMemo(
    () => getFavoritesRepository(user?.id ?? null),
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id || !isSupabaseFavoritesRepository(repository)) {
      setRemoteFavoritesLoading(false);
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;
    setRemoteFavoritesLoading(true);

    async function loadFavorites() {
      try {
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
      } finally {
        if (!cancelled) {
          markRemoteFavoritesLoadComplete(userId);
        }
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
