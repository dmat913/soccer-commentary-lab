import { canPublishFavoriteToDiscover } from "@/lib/favorites/supabase-mapping";
import {
  inferDiscoverCategory,
  parseDiscoverCategory,
} from "@/lib/discover/category";
import type {
  DiscoverCategory,
  DiscoverPost,
  DiscoverPublishedPost,
} from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";

/** DB row shape for public.discover_posts (list fields only). */
export type DiscoverPostRow = {
  id: string;
  english_text: string;
  japanese_text: string;
  meaning: string;
  learning_point_text: string;
  learning_point_meaning: string;
  category?: string | null;
  created_at: string;
};

export type DiscoverHeardCountRow = {
  post_id: string;
  heard_count: number | string;
};

export type DiscoverTrendingStatsRow = {
  post_id: string;
  recent_heard_count: number | string;
  total_heard_count: number | string;
};

export type DiscoverSaveCountRow = {
  post_id: string;
  save_count: number | string;
};

export type DiscoverMyPostRow = {
  id: string;
  source_favorite_id: string | null;
  english_text: string;
  created_at: string;
};

export type DiscoverPostInsertRow = {
  user_id: string;
  source_favorite_id: string;
  english_text: string;
  meaning: string;
  japanese_text: string;
  learning_point_text: string;
  learning_point_meaning: string;
  category: DiscoverCategory;
};

function toCount(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return 0;
}

/** Maps a Discover post row + optional counts into the UI `DiscoverPost` type. */
export function mapDiscoverPostRowToPost(
  row: DiscoverPostRow,
  counts?: {
    heardCount?: number;
    recentHeardCount?: number;
    saveCount?: number;
  }
): DiscoverPost {
  return {
    id: row.id,
    englishText: row.english_text,
    japaneseText: row.japanese_text,
    meaning: row.meaning,
    learningPointText: row.learning_point_text,
    learningPointMeaning: row.learning_point_meaning,
    category: parseDiscoverCategory(row.category),
    heardCount: counts?.heardCount ?? 0,
    recentHeardCount: counts?.recentHeardCount ?? 0,
    saveCount: counts?.saveCount ?? 0,
    createdAt: row.created_at,
  };
}

export function mapDiscoverMyPostRow(
  row: DiscoverMyPostRow
): DiscoverPublishedPost {
  return {
    id: row.id,
    englishText: row.english_text,
    sourceFavoriteId: row.source_favorite_id,
    createdAt: row.created_at,
  };
}

export function mapFavoriteToDiscoverPostInsert(
  favorite: FavoriteTranslation,
  userId: string
): DiscoverPostInsertRow {
  if (!canPublishFavoriteToDiscover(favorite)) {
    throw new Error("Favorite is missing fields required for Discover.");
  }

  const englishText = favorite.text.trim();
  const japaneseText = favorite.japaneseText.trim();
  const meaning =
    firstNonBlank(favorite.meaning, japaneseText) ?? japaneseText;
  const learningPointText =
    firstNonBlank(
      favorite.learningPoint?.text,
      favorite.vocabulary?.word,
      englishText
    ) ?? englishText;
  const learningPointMeaning =
    firstNonBlank(
      favorite.learningPoint?.meaning,
      favorite.vocabulary?.meaning,
      favorite.explanation,
      favorite.meaning,
      japaneseText
    ) ?? japaneseText;

  const category = inferDiscoverCategory({
    englishText,
    japaneseText,
    meaning,
    learningPointText,
    learningPointMeaning,
    explanation: favorite.explanation,
  });

  return {
    user_id: userId,
    source_favorite_id: favorite.id,
    english_text: englishText,
    meaning,
    japanese_text: japaneseText,
    learning_point_text: learningPointText,
    learning_point_meaning: learningPointMeaning,
    category,
  };
}

function firstNonBlank(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

export function normalizeDiscoverEnglishText(value: string): string {
  return value.trim();
}

export function findPublishedPostByEnglishText(
  posts: readonly DiscoverPublishedPost[],
  englishText: string
): DiscoverPublishedPost | undefined {
  const normalized = normalizeDiscoverEnglishText(englishText);
  return posts.find(
    (post) => normalizeDiscoverEnglishText(post.englishText) === normalized
  );
}

export function buildHeardCountMap(
  rows: readonly DiscoverHeardCountRow[] | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.post_id, toCount(row.heard_count));
  }
  return map;
}

export function buildRecentHeardCountMap(
  rows: readonly DiscoverTrendingStatsRow[] | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.post_id, toCount(row.recent_heard_count));
  }
  return map;
}

export function buildSaveCountMap(
  rows: readonly DiscoverSaveCountRow[] | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.post_id, toCount(row.save_count));
  }
  return map;
}

export function formatHeardCount(count: number): string {
  return count.toLocaleString("en-US");
}
