import { resolveLearningPoint } from "@/lib/commentary/learning-point";
import type { FavoriteTranslation } from "@/types/favorite";
import type { CommentaryLearningPoint } from "@/types/commentary";

const STORAGE_KEY = "favorite-translations";
const EMPTY_FAVORITES: FavoriteTranslation[] = [];

const favoriteListeners = new Set<() => void>();
let cachedSnapshot: FavoriteTranslation[] | null = null;

function notifyFavoriteListeners() {
  for (const listener of favoriteListeners) {
    listener();
  }
}

export function subscribeFavoriteTranslations(listener: () => void): () => void {
  favoriteListeners.add(listener);
  return () => {
    favoriteListeners.delete(listener);
  };
}

function isLearningPoint(value: unknown): value is CommentaryLearningPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const point = value as Record<string, unknown>;
  return typeof point.text === "string" && typeof point.meaning === "string";
}

function isFavoriteTranslation(value: unknown): value is FavoriteTranslation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  const hasLearningPoint =
    item.learningPoint === undefined || isLearningPoint(item.learningPoint);
  const vocabulary = item.vocabulary;
  const hasLegacyVocabulary =
    vocabulary === undefined ||
    (typeof vocabulary === "object" &&
      vocabulary !== null &&
      typeof (vocabulary as Record<string, unknown>).word === "string" &&
      typeof (vocabulary as Record<string, unknown>).meaning === "string");

  return (
    typeof item.id === "string" &&
    typeof item.japaneseText === "string" &&
    typeof item.text === "string" &&
    typeof item.meaning === "string" &&
    typeof item.createdAt === "string" &&
    (item.explanation === undefined || typeof item.explanation === "string") &&
    hasLearningPoint &&
    hasLegacyVocabulary
  );
}

export function resolveFavoriteLearningPoint(
  favorite: FavoriteTranslation
): CommentaryLearningPoint | null {
  const learningPoint = resolveLearningPoint({
    learningPoint: favorite.learningPoint,
    vocabulary: favorite.vocabulary,
  });

  return learningPoint.text ? learningPoint : null;
}

function readFavoritesFromStorage(): FavoriteTranslation[] {
  if (typeof window === "undefined") {
    return EMPTY_FAVORITES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_FAVORITES;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return EMPTY_FAVORITES;
    }

    const items = parsed.filter(isFavoriteTranslation);
    return items.length > 0 ? items : EMPTY_FAVORITES;
  } catch {
    return EMPTY_FAVORITES;
  }
}

export function getFavoriteTranslationsSnapshot(): FavoriteTranslation[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readFavoritesFromStorage();
  }

  return cachedSnapshot;
}

export function isFavoriteText(text: string): boolean {
  return getFavoriteTranslationsSnapshot().some(
    (favorite) => favorite.text === text
  );
}

export function toggleFavoriteTranslation(entry: {
  japaneseText: string;
  text: string;
  meaning: string;
  explanation?: string;
  learningPoint: CommentaryLearningPoint;
}): FavoriteTranslation[] {
  const current =
    getFavoriteTranslationsSnapshot() === EMPTY_FAVORITES
      ? []
      : [...getFavoriteTranslationsSnapshot()];
  const existingIndex = current.findIndex((favorite) => favorite.text === entry.text);

  let updated: FavoriteTranslation[];

  if (existingIndex >= 0) {
    updated = current.filter((_, index) => index !== existingIndex);
  } else {
    const newItem: FavoriteTranslation = {
      id: crypto.randomUUID(),
      japaneseText: entry.japaneseText,
      text: entry.text,
      meaning: entry.meaning,
      ...(entry.explanation ? { explanation: entry.explanation } : {}),
      learningPoint: entry.learningPoint,
      createdAt: new Date().toISOString(),
    };
    updated = [newItem, ...current];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    cachedSnapshot = updated.length > 0 ? updated : EMPTY_FAVORITES;
    notifyFavoriteListeners();
  }

  return getFavoriteTranslationsSnapshot();
}

export function getServerFavoriteTranslationsSnapshot(): FavoriteTranslation[] {
  return EMPTY_FAVORITES;
}
