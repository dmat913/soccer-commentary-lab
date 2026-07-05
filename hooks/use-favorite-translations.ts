"use client";

import { useSyncExternalStore } from "react";

import {
  getFavoriteTranslationsSnapshot,
  getServerFavoriteTranslationsSnapshot,
  subscribeFavoriteTranslations,
} from "@/lib/favorites/storage";
import type { FavoriteTranslation } from "@/types/favorite";

export function useFavoriteTranslations(): FavoriteTranslation[] {
  return useSyncExternalStore(
    subscribeFavoriteTranslations,
    getFavoriteTranslationsSnapshot,
    getServerFavoriteTranslationsSnapshot
  );
}
