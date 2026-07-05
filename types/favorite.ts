export type FavoriteLearningPoint = {
  text: string;
  meaning: string;
};

/** @deprecated 旧データ互換用。新規保存では learningPoint を使用 */
export type FavoriteVocabulary = {
  word: string;
  meaning: string;
};

export type FavoriteTranslation = {
  id: string;
  japaneseText: string;
  text: string;
  meaning: string;
  explanation?: string;
  learningPoint?: FavoriteLearningPoint;
  /** @deprecated 旧データ互換用 */
  vocabulary?: FavoriteVocabulary;
  createdAt: string;
};
