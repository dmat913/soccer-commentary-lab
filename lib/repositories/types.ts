import type {
  CommentaryLearningPoint,
  CommentaryTranslationItem,
} from "@/types/commentary";
import type { FavoriteTranslation } from "@/types/favorite";
import type { CommentaryHistoryItem } from "@/types/history";

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
  load(): CommentaryHistoryItem[];
}
