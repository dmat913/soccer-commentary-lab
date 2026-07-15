import { VOCABULARY_MASTERY_STREAK } from "@/lib/vocabulary/learning";
import type {
  VocabularyItem,
  VocabularyLearningStatus,
} from "@/types/vocabulary";

export type VocabularyStatusFilter = "all" | VocabularyLearningStatus;

export const VOCABULARY_STATUS_FILTERS: readonly VocabularyStatusFilter[] = [
  "all",
  "new",
  "learning",
  "mastered",
] as const;

export function vocabularyStatusLabel(
  status: VocabularyLearningStatus
): string {
  switch (status) {
    case "new":
      return "NEW";
    case "learning":
      return "学習中";
    case "mastered":
      return "習得済み";
  }
}

export function vocabularyStatusFilterLabel(
  filter: VocabularyStatusFilter
): string {
  if (filter === "all") {
    return "すべて";
  }
  return vocabularyStatusLabel(filter);
}

export function matchesVocabularyQuery(
  item: VocabularyItem,
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const fields = [
    item.englishText,
    item.meaning,
    item.japaneseText,
    item.learningPoint?.text ?? "",
    item.learningPoint?.meaning ?? "",
  ];

  return fields.some((field) => field.toLowerCase().includes(needle));
}

export function filterVocabularyItems(
  items: readonly VocabularyItem[],
  query: string,
  statusFilter: VocabularyStatusFilter
): VocabularyItem[] {
  return items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    return matchesVocabularyQuery(item, query);
  });
}

export type VocabularySortOption =
  | "recently-added"
  | "recently-reviewed"
  | "learning-first"
  | "a-z";

export const VOCABULARY_SORT_OPTIONS: readonly VocabularySortOption[] = [
  "recently-added",
  "recently-reviewed",
  "learning-first",
  "a-z",
] as const;

export function isVocabularySortOption(
  value: string
): value is VocabularySortOption {
  return (VOCABULARY_SORT_OPTIONS as readonly string[]).includes(value);
}

export function vocabularySortOptionLabel(
  option: VocabularySortOption
): string {
  switch (option) {
    case "recently-added":
      return "最近追加";
    case "recently-reviewed":
      return "最近学習";
    case "learning-first":
      return "学習中を優先";
    case "a-z":
      return "A–Z";
  }
}

function parseVocabularyTimestamp(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** Matches the list row primary English label (Learning Point text, else englishText). */
export function vocabularyListSortKey(item: VocabularyItem): string {
  const learningPoint = item.learningPoint?.text.trim() ?? "";
  const primary = learningPoint || item.englishText.trim();
  return primary.toLocaleLowerCase();
}

function statusPriority(status: VocabularyLearningStatus): number {
  switch (status) {
    case "learning":
      return 0;
    case "new":
      return 1;
    case "mastered":
      return 2;
  }
}

function compareTimestampsDesc(
  left: number | null,
  right: number | null
): number | null {
  if (left !== null && right !== null) {
    if (left !== right) {
      return right - left;
    }
    return 0;
  }
  if (left !== null && right === null) {
    return -1;
  }
  if (left === null && right !== null) {
    return 1;
  }
  return null;
}

/**
 * Sorts a filtered Vocabulary list. Does not mutate the input array.
 * Tie-breaks with original index for stable order.
 */
export function sortVocabularyItems(
  items: readonly VocabularyItem[],
  sortOption: VocabularySortOption
): VocabularyItem[] {
  const indexed = items.map((item, index) => ({ item, index }));

  indexed.sort((a, b) => {
    const left = a.item;
    const right = b.item;
    const leftCreated = parseVocabularyTimestamp(left.createdAt);
    const rightCreated = parseVocabularyTimestamp(right.createdAt);
    const leftReviewed = parseVocabularyTimestamp(left.lastReviewedAt);
    const rightReviewed = parseVocabularyTimestamp(right.lastReviewedAt);

    if (sortOption === "recently-added") {
      const byCreated = compareTimestampsDesc(leftCreated, rightCreated);
      if (byCreated !== null && byCreated !== 0) {
        return byCreated;
      }
      // Both missing/invalid/equal → keep original relative order.
      if (leftCreated === null && rightCreated === null) {
        return a.index - b.index;
      }
      return a.index - b.index;
    }

    if (sortOption === "recently-reviewed") {
      const byReviewed = compareTimestampsDesc(leftReviewed, rightReviewed);
      if (byReviewed !== null && byReviewed !== 0) {
        return byReviewed;
      }
      const byCreated = compareTimestampsDesc(leftCreated, rightCreated);
      if (byCreated !== null && byCreated !== 0) {
        return byCreated;
      }
      return a.index - b.index;
    }

    if (sortOption === "learning-first") {
      const byStatus =
        statusPriority(left.status) - statusPriority(right.status);
      if (byStatus !== 0) {
        return byStatus;
      }
      const byReviewed = compareTimestampsDesc(leftReviewed, rightReviewed);
      if (byReviewed !== null && byReviewed !== 0) {
        return byReviewed;
      }
      const byCreated = compareTimestampsDesc(leftCreated, rightCreated);
      if (byCreated !== null && byCreated !== 0) {
        return byCreated;
      }
      return a.index - b.index;
    }

    // a-z
    const byText = vocabularyListSortKey(left).localeCompare(
      vocabularyListSortKey(right),
      undefined,
      { sensitivity: "base" }
    );
    if (byText !== 0) {
      return byText;
    }
    const byCreated = compareTimestampsDesc(leftCreated, rightCreated);
    if (byCreated !== null && byCreated !== 0) {
      return byCreated;
    }
    return a.index - b.index;
  });

  return indexed.map((entry) => entry.item);
}

const VOCABULARY_REVIEW_LIMIT = 3;

function compareTimestampsAsc(
  left: number | null,
  right: number | null
): number | null {
  if (left !== null && right !== null) {
    if (left !== right) {
      return left - right;
    }
    return 0;
  }
  if (left !== null && right === null) {
    return 1;
  }
  if (left === null && right !== null) {
    return -1;
  }
  return null;
}

/**
 * Picks up to 3 review candidates from the full Vocabulary snapshot.
 * Prefers learning (never reviewed / oldest review first), then oldest new.
 * Excludes mastered. Does not mutate the input.
 */
export function getVocabularyReviewRecommendations(
  items: readonly VocabularyItem[],
  limit: number = VOCABULARY_REVIEW_LIMIT
): VocabularyItem[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0 || items.length === 0) {
    return [];
  }

  const learning = items
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.status === "learning");

  learning.sort((a, b) => {
    const leftReviewed = parseVocabularyTimestamp(a.item.lastReviewedAt);
    const rightReviewed = parseVocabularyTimestamp(b.item.lastReviewedAt);
    // Missing lastReviewedAt comes first among learning.
    if (leftReviewed === null && rightReviewed !== null) {
      return -1;
    }
    if (leftReviewed !== null && rightReviewed === null) {
      return 1;
    }
    const byReviewed = compareTimestampsAsc(leftReviewed, rightReviewed);
    if (byReviewed !== null && byReviewed !== 0) {
      return byReviewed;
    }
    const byCreated = compareTimestampsAsc(
      parseVocabularyTimestamp(a.item.createdAt),
      parseVocabularyTimestamp(b.item.createdAt)
    );
    if (byCreated !== null && byCreated !== 0) {
      return byCreated;
    }
    return a.index - b.index;
  });

  const picked: VocabularyItem[] = [];
  const seen = new Set<string>();

  for (const entry of learning) {
    if (picked.length >= safeLimit) {
      break;
    }
    if (seen.has(entry.item.id)) {
      continue;
    }
    seen.add(entry.item.id);
    picked.push(entry.item);
  }

  if (picked.length >= safeLimit) {
    return picked;
  }

  const news = items
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.status === "new");

  news.sort((a, b) => {
    const byCreated = compareTimestampsAsc(
      parseVocabularyTimestamp(a.item.createdAt),
      parseVocabularyTimestamp(b.item.createdAt)
    );
    if (byCreated !== null && byCreated !== 0) {
      return byCreated;
    }
    return a.index - b.index;
  });

  for (const entry of news) {
    if (picked.length >= safeLimit) {
      break;
    }
    if (seen.has(entry.item.id)) {
      continue;
    }
    seen.add(entry.item.id);
    picked.push(entry.item);
  }

  return picked;
}

/** Compact last-reviewed label for review recommendations. */
export function formatVocabularyReviewRecency(
  lastReviewedAt: string | undefined,
  nowMs: number = Date.now()
): string {
  const reviewedAt = parseVocabularyTimestamp(lastReviewedAt);
  if (reviewedAt === null) {
    return "未学習";
  }

  const startOfDay = (ms: number) => {
    const date = new Date(ms);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    (startOfDay(nowMs) - startOfDay(reviewedAt)) / dayMs
  );

  if (diffDays <= 0) {
    return "今日";
  }
  if (diffDays === 1) {
    return "昨日";
  }
  if (diffDays < 14) {
    return `${diffDays}日前`;
  }

  return new Date(reviewedAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatVocabularyReviewedAt(
  lastReviewedAt: string | undefined
): string {
  if (!lastReviewedAt?.trim()) {
    return "まだ学習していません";
  }

  const date = new Date(lastReviewedAt);
  if (Number.isNaN(date.getTime())) {
    return "まだ学習していません";
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function vocabularyStreakProgressLabel(
  correctStreak: number
): string {
  const safeStreak =
    typeof correctStreak === "number" &&
    Number.isFinite(correctStreak) &&
    correctStreak > 0
      ? Math.floor(correctStreak)
      : 0;
  return `${safeStreak} / ${VOCABULARY_MASTERY_STREAK}`;
}

export type VocabularyLearningSummary = {
  total: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
};

/** Counts learning statuses from the current Vocabulary snapshot. */
export function summarizeVocabularyLearning(
  items: readonly VocabularyItem[]
): VocabularyLearningSummary {
  let newCount = 0;
  let learningCount = 0;
  let masteredCount = 0;

  for (const item of items) {
    switch (item.status) {
      case "new":
        newCount += 1;
        break;
      case "learning":
        learningCount += 1;
        break;
      case "mastered":
        masteredCount += 1;
        break;
    }
  }

  return {
    total: items.length,
    newCount,
    learningCount,
    masteredCount,
  };
}

export function vocabularyFilterEmptyCopy(options: {
  hasQuery: boolean;
  statusFilter: VocabularyStatusFilter;
}): { title: string; description: string } {
  const { hasQuery, statusFilter } = options;

  if (hasQuery && statusFilter !== "all") {
    return {
      title: "条件に一致する表現がありません",
      description: `「${vocabularyStatusFilterLabel(statusFilter)}」と検索キーワードの両方に合う表現がありません。条件を変えてみてください。`,
    };
  }

  if (hasQuery) {
    return {
      title: "検索結果がありません",
      description: "検索キーワードを変えてみてください",
    };
  }

  if (statusFilter !== "all") {
    return {
      title: "このステータスの表現はまだありません",
      description: `「${vocabularyStatusFilterLabel(statusFilter)}」の表現はまだありません。QuizやDaily Challengeで学習を進めると表示されます。`,
    };
  }

  return {
    title: "単語帳は空です",
    description: "Homeで英語実況を作って追加しましょう",
  };
}
