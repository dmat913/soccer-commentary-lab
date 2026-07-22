import type {
  CommentaryLearningPoint,
  CommentaryTranslationItem,
} from "@/types/commentary";
import type {
  DailyChallenge,
  StartDailyChallengeInput,
} from "@/types/daily-challenge";
import type {
  DiscoverHeardToggleResult,
  DiscoverPost,
  DiscoverPublishedPost,
  DiscoverPublishResult,
  DiscoverSaveResult,
} from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";
import type { CommentaryHistoryItem } from "@/types/history";
import type { VocabularyAddEntry, VocabularyItem } from "@/types/vocabulary";

export type FavoriteToggleEntry = {
  japaneseText: string;
  text: string;
  meaning: string;
  explanation?: string;
  learningPoint: CommentaryLearningPoint;
};

export type HistoryAddEntry = {
  japaneseText: string;
  translations: CommentaryTranslationItem[];
};

export interface FavoritesRepository {
  subscribe(listener: () => void): () => void;
  getSnapshot(): FavoriteTranslation[];
  getServerSnapshot(): FavoriteTranslation[];
  toggleFavorite(entry: FavoriteToggleEntry): FavoriteTranslation[];
  isFavoriteText(text: string): boolean;
}

export interface HistoryRepository {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CommentaryHistoryItem[];
  getServerSnapshot(): CommentaryHistoryItem[];
  add(entry: HistoryAddEntry): CommentaryHistoryItem[];
  remove(id: string): CommentaryHistoryItem[];
  load(): CommentaryHistoryItem[];
}

export interface VocabularyRepository {
  subscribe(listener: () => void): () => void;
  getSnapshot(): VocabularyItem[];
  getServerSnapshot(): VocabularyItem[];
  load(): VocabularyItem[];
  add(entry: VocabularyAddEntry): VocabularyItem[];
  remove(id: string): VocabularyItem[];
  isSaved(englishText: string): boolean;
  /** Applies one answer via shared mastery rules (never sets mastered directly). */
  applyAnswer(id: string, isCorrect: boolean): VocabularyItem[];
  /** User demotion: mastered (or any status) → learning with streak 0. */
  markStillLearning(id: string): VocabularyItem[];
}

/**
 * Discover feed reads, author publish/unpublish, Heard reactions,
 * and Vocabulary membership saves (discover_saves).
 */
export interface DiscoverRepository {
  listPosts(): Promise<DiscoverPost[]>;
  getTrendingPosts(): Promise<DiscoverPost[]>;
  getNewestPosts(): Promise<DiscoverPost[]>;
  getPopularPosts(): Promise<DiscoverPost[]>;
  listMyPosts(userId: string): Promise<DiscoverPublishedPost[]>;
  isPublished(userId: string, englishText: string): Promise<boolean>;
  publishPost(
    favorite: FavoriteTranslation,
    userId: string
  ): Promise<DiscoverPublishResult>;
  deletePost(postId: string, userId: string): Promise<void>;
  listMyHeardPostIds(userId: string): Promise<string[]>;
  markPostAsHeard(
    postId: string,
    userId: string
  ): Promise<DiscoverHeardToggleResult>;
  unmarkPostAsHeard(postId: string, userId: string): Promise<void>;
  listMySavedPostIds(userId: string): Promise<string[]>;
  markPostAsSaved(
    postId: string,
    userId: string
  ): Promise<DiscoverSaveResult>;
  unmarkPostAsSaved(postId: string, userId: string): Promise<void>;
}

/**
 * Daily Challenge repository. Snapshot is today's record only (or null).
 * Persistence details live in the storage / remote implementation.
 */
export interface DailyChallengeRepository {
  subscribe(listener: () => void): () => void;
  /** Today's Challenge, or null when absent / from a previous JST day. */
  getSnapshot(): DailyChallenge | null;
  getServerSnapshot(): DailyChallenge | null;
  start(input: StartDailyChallengeInput): DailyChallenge;
  answer(optionId: string): void;
  advance(): void;
  /** Drop a leftover record from a previous JST day (no-op when fresh). */
  invalidateStale(): void;
  clear(): void;
}
