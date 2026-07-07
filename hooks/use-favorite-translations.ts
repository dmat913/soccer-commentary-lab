"use client";

import { useSyncExternalStore } from "react";

import { getFavoritesRepository } from "@/lib/repositories";
import type { FavoriteToggleEntry } from "@/lib/repositories/types";
import type { FavoriteTranslation } from "@/types/favorite";

const favoritesRepository = getFavoritesRepository();

export function useFavoriteTranslations(): FavoriteTranslation[] {
  return useSyncExternalStore(
    favoritesRepository.subscribe.bind(favoritesRepository),
    favoritesRepository.getSnapshot.bind(favoritesRepository),
    favoritesRepository.getServerSnapshot.bind(favoritesRepository)
  );
}

export function toggleFavorite(
  entry: FavoriteToggleEntry
): FavoriteTranslation[] {
  return favoritesRepository.toggleFavorite(entry);
}
