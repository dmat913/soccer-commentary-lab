import {
  addVocabularyItem,
  applyVocabularyAnswerById,
  getServerVocabularyItemsSnapshot,
  getVocabularyItemsSnapshot,
  isVocabularyItemSaved,
  markVocabularyStillLearningById,
  removeVocabularyItem,
  subscribeVocabularyItems,
} from "@/lib/vocabulary/storage";
import type { VocabularyRepository } from "@/lib/repositories/types";

export const localVocabularyRepository: VocabularyRepository = {
  subscribe: subscribeVocabularyItems,
  getSnapshot: getVocabularyItemsSnapshot,
  getServerSnapshot: getServerVocabularyItemsSnapshot,
  load: getVocabularyItemsSnapshot,
  add: addVocabularyItem,
  remove: removeVocabularyItem,
  isSaved: isVocabularyItemSaved,
  applyAnswer: applyVocabularyAnswerById,
  markStillLearning: markVocabularyStillLearningById,
};
