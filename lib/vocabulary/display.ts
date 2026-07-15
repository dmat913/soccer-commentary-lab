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
