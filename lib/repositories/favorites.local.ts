import {
  getFavoriteTranslationsSnapshot,
  getServerFavoriteTranslationsSnapshot,
  isFavoriteText,
  subscribeFavoriteTranslations,
  toggleFavoriteTranslation,
} from "@/lib/favorites/storage";
import type { FavoritesRepository } from "@/lib/repositories/types";

export const localFavoritesRepository: FavoritesRepository = {
  subscribe: subscribeFavoriteTranslations,
  getSnapshot: getFavoriteTranslationsSnapshot,
  getServerSnapshot: getServerFavoriteTranslationsSnapshot,
  toggleFavorite: toggleFavoriteTranslation,
  isFavoriteText,
};
