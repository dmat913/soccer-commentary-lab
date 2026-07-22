import type { VocabularyLearningStatus } from "@/types/vocabulary";

/**
 * Vocabulary learning status colors — distinct hues so NEW / Learning /
 * Mastered are readable at a glance (not emerald-only gradients).
 */
export function vocabularyStatusBadgeClassName(
  status: VocabularyLearningStatus,
  selected = false
): string {
  switch (status) {
    case "new":
      return selected
        ? "border-sky-400 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-500 dark:text-sky-950"
        : "border-sky-300 bg-sky-100 text-sky-950 dark:border-sky-700 dark:bg-sky-950/55 dark:text-sky-100";
    case "learning":
      return selected
        ? "border-amber-400 bg-amber-500 text-amber-950 dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950"
        : "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/55 dark:text-amber-100";
    case "mastered":
      return selected
        ? "border-emerald-500 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-emerald-950"
        : "border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-100";
  }
}

export function vocabularyStatusDotClassName(
  status: VocabularyLearningStatus
): string {
  switch (status) {
    case "new":
      return "bg-sky-500";
    case "learning":
      return "bg-amber-500";
    case "mastered":
      return "bg-emerald-600";
  }
}
