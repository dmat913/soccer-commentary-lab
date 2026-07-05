import type { CommentaryTranslationItem } from "@/types/commentary";

/** localStorage に保存される translation の生データ（旧 vocabulary 含む） */
export type StoredHistoryTranslation = {
  text: string;
  meaning: string;
  explanation?: string;
  learningPoint?: {
    text: string;
    meaning: string;
  };
  /** @deprecated 旧データ互換用 */
  vocabulary?: {
    word: string;
    meaning: string;
  };
};

export type CommentaryHistoryItem = {
  id: string;
  japaneseText: string;
  translations: CommentaryTranslationItem[];
  savedAt: string;
};
