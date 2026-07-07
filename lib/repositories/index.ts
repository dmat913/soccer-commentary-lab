import { localFavoritesRepository } from "@/lib/repositories/favorites.local";
import { localHistoryRepository } from "@/lib/repositories/history.local";
import type {
  FavoritesRepository,
  HistoryRepository,
} from "@/lib/repositories/types";

export function getFavoritesRepository(): FavoritesRepository {
  return localFavoritesRepository;
}

export function getHistoryRepository(): HistoryRepository {
  return localHistoryRepository;
}
