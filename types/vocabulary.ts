import type { CommentaryLearningPoint } from "@/types/commentary";

export type VocabularyLearningStatus = "new" | "learning" | "mastered";

export type VocabularyItem = {
  id: string;
  englishText: string;
  meaning: string;
  japaneseText: string;
  learningPoint?: CommentaryLearningPoint;
  createdAt: string;
  status: VocabularyLearningStatus;
  correctStreak: number;
  lastReviewedAt?: string;
};

export type VocabularyAddEntry = {
  englishText: string;
  meaning: string;
  japaneseText: string;
  learningPoint?: CommentaryLearningPoint;
};

/** Snapshot of learning fields used by status transitions and sync merge. */
export type VocabularyLearningState = {
  status: VocabularyLearningStatus;
  correctStreak: number;
  lastReviewedAt?: string;
};
