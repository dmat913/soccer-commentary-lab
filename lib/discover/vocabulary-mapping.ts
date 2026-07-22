import { normalizeDiscoverEnglishText } from "@/lib/discover/supabase-mapping";
import type { DiscoverPost } from "@/types/discover";
import type { VocabularyAddEntry } from "@/types/vocabulary";

/**
 * Maps a Discover feed post into a Vocabulary add payload.
 * status / streak / createdAt are filled by the Vocabulary repository.
 */
export function mapDiscoverPostToVocabularyAddEntry(
  post: DiscoverPost
): VocabularyAddEntry {
  const learningPointText = post.learningPointText.trim();
  const learningPointMeaning = post.learningPointMeaning.trim();

  return {
    englishText: post.englishText.trim(),
    meaning: post.meaning.trim(),
    japaneseText: post.japaneseText.trim(),
    ...(learningPointText
      ? {
          learningPoint: {
            text: learningPointText,
            meaning: learningPointMeaning,
          },
        }
      : {}),
  };
}

export function isDiscoverPostSavedInVocabulary(
  isVocabularyItemSaved: (englishText: string) => boolean,
  post: Pick<DiscoverPost, "englishText">
): boolean {
  return isVocabularyItemSaved(
    normalizeDiscoverEnglishText(post.englishText)
  );
}

/**
 * Discover card "追加済み" UI state.
 * Vocabulary membership is authoritative (option B): an orphaned
 * discover_saves row without Vocabulary must not look saved.
 */
export function isDiscoverVocabularyAddedInUi(options: {
  isInVocabulary: boolean;
  hasDiscoverSave: boolean;
}): boolean {
  void options.hasDiscoverSave;
  return options.isInVocabulary;
}
