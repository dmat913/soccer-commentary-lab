import type { CommentaryLearningPoint } from "@/types/commentary";

type LegacyVocabulary = {
  word: string;
  meaning: string;
};

type LearningPointSource = {
  learningPoint?: CommentaryLearningPoint;
  vocabulary?: LegacyVocabulary;
};

export function resolveLearningPoint(
  source: LearningPointSource
): CommentaryLearningPoint {
  if (source.learningPoint?.text.trim()) {
    return {
      text: source.learningPoint.text.trim(),
      meaning: source.learningPoint.meaning.trim(),
    };
  }

  if (source.vocabulary?.word.trim()) {
    return {
      text: source.vocabulary.word.trim(),
      meaning: source.vocabulary.meaning.trim(),
    };
  }

  return { text: "", meaning: "" };
}
