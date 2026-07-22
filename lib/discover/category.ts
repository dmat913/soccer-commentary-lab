import { categoryBadgeClassName } from "@/lib/design/category";
import { sortDiscoverPosts } from "@/lib/discover/sorting";
import type {
  DiscoverCategory,
  DiscoverCategoryFilter,
  DiscoverPost,
  DiscoverSortOption,
} from "@/types/discover";
import {
  DISCOVER_CATEGORIES,
  DISCOVER_CATEGORY_LABELS,
  DISCOVER_CATEGORY_PRIORITY,
} from "@/types/discover";

export type DiscoverCategoryInferenceInput = {
  englishText?: string | null;
  japaneseText?: string | null;
  meaning?: string | null;
  learningPointText?: string | null;
  learningPointMeaning?: string | null;
  explanation?: string | null;
};

const CATEGORY_KEYWORDS: Record<
  Exclude<DiscoverCategory, "general">,
  readonly string[]
> = {
  "set-piece": [
    "free kick",
    "penalty",
    "corner",
    "set piece",
    "spot kick",
    "フリーキック",
    "pk",
    "ペナルティ",
    "コーナーキック",
    "セットプレー",
  ],
  save: [
    "save",
    "saves",
    "denied",
    "goalkeeper",
    "keeper",
    "stop",
    "block",
    "セーブ",
    "キーパー",
    "止めた",
    "防いだ",
  ],
  goal: [
    "goal",
    "scores",
    "scored",
    "finish",
    "finishes",
    "finishing",
    "back of the net",
    "finds the net",
    "ゴール",
    "得点",
    "決めた",
    "フィニッシュ",
  ],
  shot: [
    "shot",
    "shoots",
    "strike",
    "effort",
    "volley",
    "header",
    "top corner",
    "post",
    "crossbar",
    "シュート",
    "ボレー",
    "ヘディング",
    "ポスト",
    "クロスバー",
  ],
  pass: [
    "pass",
    "through ball",
    "cross",
    "delivery",
    "switch",
    "assist",
    "cutback",
    "パス",
    "スルーパス",
    "クロス",
    "サイドチェンジ",
    "アシスト",
  ],
  dribble: [
    "dribble",
    "run",
    "takes on",
    "beats his man",
    "skill",
    "nutmeg",
    "ドリブル",
    "突破",
    "抜いた",
    "股抜き",
  ],
  defending: [
    "tackle",
    "interception",
    "clearance",
    "defend",
    "defending",
    "challenge",
    "block",
    "タックル",
    "インターセプト",
    "クリア",
    "守備",
  ],
};

function normalizeCategoryField(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildInferenceHaystack(
  input: DiscoverCategoryInferenceInput
): string {
  return [
    input.englishText,
    input.japaneseText,
    input.meaning,
    input.learningPointText,
    input.learningPointMeaning,
    input.explanation,
  ]
    .map(normalizeCategoryField)
    .filter((part) => part.length > 0)
    .join("\n");
}

function matchesCategoryKeywords(
  haystack: string,
  keywords: readonly string[]
): boolean {
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

/**
 * Infers a Discover category from Favorite / post text fields.
 * Pure: does not mutate `input`.
 */
export function inferDiscoverCategory(
  input: DiscoverCategoryInferenceInput
): DiscoverCategory {
  const haystack = buildInferenceHaystack(input);
  if (haystack.length === 0) {
    return "general";
  }

  for (const category of DISCOVER_CATEGORY_PRIORITY) {
    if (category === "general") {
      continue;
    }
    if (matchesCategoryKeywords(haystack, CATEGORY_KEYWORDS[category])) {
      return category;
    }
  }

  return "general";
}

/** Alias kept for call-site clarity. */
export const classifyDiscoverCategory = inferDiscoverCategory;

export function isDiscoverCategory(value: unknown): value is DiscoverCategory {
  return (
    typeof value === "string" &&
    (DISCOVER_CATEGORIES as readonly string[]).includes(value)
  );
}

/** Maps DB / unknown values to a safe DiscoverCategory. */
export function parseDiscoverCategory(value: unknown): DiscoverCategory {
  return isDiscoverCategory(value) ? value : "general";
}

export function discoverCategoryLabel(category: DiscoverCategory): string {
  return DISCOVER_CATEGORY_LABELS[category];
}

export function isDiscoverCategoryFilter(
  value: string
): value is DiscoverCategoryFilter {
  return value === "all" || isDiscoverCategory(value);
}

export function matchesDiscoverCategoryFilter(
  category: DiscoverCategory,
  filter: DiscoverCategoryFilter
): boolean {
  return filter === "all" || category === filter;
}

export function filterDiscoverFeedPosts(
  posts: readonly DiscoverPost[],
  options: {
    query: string;
    category: DiscoverCategoryFilter;
    sort: DiscoverSortOption;
  }
): DiscoverPost[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  const filtered = posts.filter((post) => {
    if (!matchesDiscoverCategoryFilter(post.category, options.category)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      post.englishText,
      post.japaneseText,
      post.meaning,
      post.learningPointText,
      post.learningPointMeaning,
      discoverCategoryLabel(post.category),
    ].some((field) => field.toLowerCase().includes(normalizedQuery));
  });

  return sortDiscoverPosts(filtered, options.sort);
}

/** Discover category badge classes (Design System v1). */
export function discoverCategoryBadgeClassName(
  category: DiscoverCategory
): string {
  return categoryBadgeClassName(category);
}
