import {
  createSupabaseFavoritesRepository,
  type SupabaseFavoritesRepository,
} from "@/lib/repositories/favorites.supabase";
import { localFavoritesRepository } from "@/lib/repositories/favorites.local";
import { localHistoryRepository } from "@/lib/repositories/history.local";
import {
  createSupabaseHistoryRepository,
  type SupabaseHistoryRepository,
} from "@/lib/repositories/history.supabase";
import type {
  FavoritesRepository,
  HistoryRepository,
} from "@/lib/repositories/types";

const supabaseFavoritesRepositories = new Map<
  string,
  SupabaseFavoritesRepository
>();

const supabaseHistoryRepositories = new Map<
  string,
  SupabaseHistoryRepository
>();

export function getFavoritesRepository(
  userId?: string | null
): FavoritesRepository {
  if (!userId) {
    return localFavoritesRepository;
  }

  let repository = supabaseFavoritesRepositories.get(userId);

  if (!repository) {
    repository = createSupabaseFavoritesRepository(userId);
    supabaseFavoritesRepositories.set(userId, repository);
  }

  return repository;
}

export function getHistoryRepository(
  userId?: string | null
): HistoryRepository {
  if (!userId) {
    return localHistoryRepository;
  }

  let repository = supabaseHistoryRepositories.get(userId);

  if (!repository) {
    repository = createSupabaseHistoryRepository(userId);
    supabaseHistoryRepositories.set(userId, repository);
  }

  return repository;
}
