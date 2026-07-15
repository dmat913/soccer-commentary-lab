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
import { localDailyChallengeRepository } from "@/lib/repositories/daily.local";
import {
  createSupabaseDailyChallengeRepository,
  type SupabaseDailyChallengeRepository,
} from "@/lib/repositories/daily.supabase";
import { localVocabularyRepository } from "@/lib/repositories/vocabulary.local";
import {
  createSupabaseVocabularyRepository,
  type SupabaseVocabularyRepository,
} from "@/lib/repositories/vocabulary.supabase";
import type {
  DailyChallengeRepository,
  FavoritesRepository,
  HistoryRepository,
  VocabularyRepository,
} from "@/lib/repositories/types";

const supabaseFavoritesRepositories = new Map<
  string,
  SupabaseFavoritesRepository
>();

const supabaseHistoryRepositories = new Map<
  string,
  SupabaseHistoryRepository
>();

const supabaseVocabularyRepositories = new Map<
  string,
  SupabaseVocabularyRepository
>();

const supabaseDailyChallengeRepositories = new Map<
  string,
  SupabaseDailyChallengeRepository
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

export function getVocabularyRepository(
  userId?: string | null
): VocabularyRepository {
  if (!userId) {
    return localVocabularyRepository;
  }

  let repository = supabaseVocabularyRepositories.get(userId);

  if (!repository) {
    repository = createSupabaseVocabularyRepository(userId);
    supabaseVocabularyRepositories.set(userId, repository);
  }

  return repository;
}

/**
 * Daily Challenge repository.
 * - No userId → shared localStorage repository
 * - With userId → per-user Supabase repository (cached by userId)
 */
export function getDailyChallengeRepository(
  userId?: string | null
): DailyChallengeRepository {
  if (!userId) {
    return localDailyChallengeRepository;
  }

  let repository = supabaseDailyChallengeRepositories.get(userId);

  if (!repository) {
    repository = createSupabaseDailyChallengeRepository(userId);
    supabaseDailyChallengeRepositories.set(userId, repository);
  }

  return repository;
}
