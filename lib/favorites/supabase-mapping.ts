import type { FavoriteTranslation } from "@/types/favorite";

/** DB row shape used by Favorites Supabase repository. */
export type FavoriteRow = {
  id: string;
  user_id: string;
  japanese_text: string;
  english_text: string;
  style: string | null;
  meaning: string | null;
  explanation: string | null;
  learning_point: string | null;
  learning_point_meaning: string | null;
  created_at: string;
  updated_at: string;
};

export type FavoriteInsertRow = Omit<FavoriteRow, "updated_at"> & {
  updated_at: string;
};

/** Sparse patch for filling empty remote fields from local (never overwrites non-empty). */
export type FavoriteEnrichmentPatch = {
  meaning?: string;
  explanation?: string | null;
  learning_point?: string | null;
  learning_point_meaning?: string | null;
};

function nullableTrimmed(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isBlank(value: string | null | undefined): boolean {
  return nullableTrimmed(value) === null;
}

/**
 * Maps a Favorites Supabase row to FavoriteTranslation.
 * Missing/null added columns fall back safely for older rows.
 */
export function mapFavoriteRowToTranslation(row: FavoriteRow): FavoriteTranslation {
  const meaning = row.meaning?.trim() ?? "";
  const explanation = nullableTrimmed(row.explanation) ?? undefined;
  const learningPointText = row.learning_point?.trim() ?? "";
  const learningPointMeaning = row.learning_point_meaning?.trim() ?? "";

  const favorite: FavoriteTranslation = {
    id: row.id,
    japaneseText: row.japanese_text,
    text: row.english_text,
    meaning,
    createdAt: row.created_at,
  };

  if (explanation) {
    favorite.explanation = explanation;
  }

  if (learningPointText || learningPointMeaning) {
    favorite.learningPoint = {
      text: learningPointText,
      meaning: learningPointMeaning,
    };
  }

  return favorite;
}

/** Maps FavoriteTranslation to a Favorites insert/upsert row. */
export function mapFavoriteTranslationToInsertRow(
  favorite: FavoriteTranslation,
  userId: string
): FavoriteInsertRow {
  const timestamp = favorite.createdAt;

  return {
    id: favorite.id,
    user_id: userId,
    japanese_text: favorite.japaneseText,
    english_text: favorite.text,
    style: null,
    meaning: nullableTrimmed(favorite.meaning),
    explanation: nullableTrimmed(favorite.explanation),
    learning_point: nullableTrimmed(favorite.learningPoint?.text),
    learning_point_meaning: nullableTrimmed(favorite.learningPoint?.meaning),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Builds an UPDATE patch when local has non-empty fields that remote is missing.
 * Does not overwrite non-empty remote values. Returns null when nothing to do.
 */
export function getFavoriteRemoteEnrichmentPatch(
  remote: FavoriteTranslation,
  local: FavoriteTranslation
): FavoriteEnrichmentPatch | null {
  const patch: FavoriteEnrichmentPatch = {};

  if (isBlank(remote.meaning) && !isBlank(local.meaning)) {
    patch.meaning = local.meaning.trim();
  }

  if (isBlank(remote.explanation) && !isBlank(local.explanation)) {
    patch.explanation = local.explanation!.trim();
  }

  if (
    isBlank(remote.learningPoint?.text) &&
    !isBlank(local.learningPoint?.text)
  ) {
    patch.learning_point = local.learningPoint!.text.trim();
  }

  if (
    isBlank(remote.learningPoint?.meaning) &&
    !isBlank(local.learningPoint?.meaning)
  ) {
    patch.learning_point_meaning = local.learningPoint!.meaning.trim();
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Whether a Favorite has the minimum fields needed to publish to Discover.
 * Only English commentary and original Japanese are required; meaning / LP
 * fall back at insert time for legacy incomplete Favorites.
 */
export function canPublishFavoriteToDiscover(
  favorite: FavoriteTranslation
): boolean {
  return !isBlank(favorite.text) && !isBlank(favorite.japaneseText);
}

export function getDiscoverPublishUnavailableReason(
  favorite: FavoriteTranslation
): string | null {
  if (isBlank(favorite.text)) {
    return "英語実況がないため公開できません";
  }
  if (isBlank(favorite.japaneseText)) {
    return "元の日本語がないため公開できません";
  }
  return null;
}
