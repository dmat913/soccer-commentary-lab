import type { QuizOption, QuizQuestion } from "@/types/quiz";
import type { VocabularyItem } from "@/types/vocabulary";

export const QUIZ_MIN_ITEMS = 4;
export const QUIZ_MAX_QUESTIONS = 5;
export const QUIZ_OPTION_COUNT = 4;

/** In-place-free Fisher–Yates shuffle returning a new array. */
function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Candidate = {
  id: string;
  englishText: string;
  meaning: string;
  japaneseText: string;
  learningPoint?: VocabularyItem["learningPoint"];
};

/**
 * Builds a session's worth of "Japanese meaning -> English commentary" 4-choice
 * questions from the saved vocabulary. Pure function: call once per session so
 * the order is stable across renders.
 *
 * Rules:
 * - Prompt = meaning, correct answer = englishText, distractors = other englishText.
 * - Distractors sharing the target's japaneseText are avoided when possible, so
 *   two answers from the same original sentence never compete as "both correct".
 * - Only falls back to same-japaneseText distractors when unavoidable.
 * - A question that cannot reach 4 distinct options is skipped (no 2/3-choice).
 */
export function createQuizQuestions(items: VocabularyItem[]): QuizQuestion[] {
  const pool: Candidate[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const englishText = item.englishText.trim();
    if (!englishText || seen.has(englishText)) {
      continue;
    }
    seen.add(englishText);
    pool.push({
      id: item.id,
      englishText,
      meaning: item.meaning.trim(),
      japaneseText: item.japaneseText.trim(),
      learningPoint: item.learningPoint,
    });
  }

  if (pool.length < QUIZ_MIN_ITEMS) {
    return [];
  }

  // A question needs a prompt; items without a meaning can still be distractors.
  const questionable = pool.filter((candidate) => candidate.meaning.length > 0);
  if (questionable.length === 0) {
    return [];
  }

  const questionCount = Math.min(questionable.length, QUIZ_MAX_QUESTIONS);
  const targets = shuffle(questionable);
  const questions: QuizQuestion[] = [];
  let questionIndex = 0;

  for (const target of targets) {
    if (questions.length >= questionCount) {
      break;
    }

    const correct = target.englishText;
    const usedTexts = new Set<string>([correct]);
    const distractors: string[] = [];

    const preferred = pool.filter(
      (candidate) =>
        candidate.englishText !== correct &&
        (target.japaneseText === "" ||
          candidate.japaneseText !== target.japaneseText)
    );
    const fallback = pool.filter(
      (candidate) => candidate.englishText !== correct
    );

    for (const source of [shuffle(preferred), shuffle(fallback)]) {
      for (const candidate of source) {
        if (distractors.length >= QUIZ_OPTION_COUNT - 1) {
          break;
        }
        if (usedTexts.has(candidate.englishText)) {
          continue;
        }
        usedTexts.add(candidate.englishText);
        distractors.push(candidate.englishText);
      }
      if (distractors.length >= QUIZ_OPTION_COUNT - 1) {
        break;
      }
    }

    if (distractors.length < QUIZ_OPTION_COUNT - 1) {
      // Cannot form a full 4-option question safely; exclude it.
      continue;
    }

    const optionTexts = shuffle([correct, ...distractors]);
    const options: QuizOption[] = optionTexts.map((text, index) => ({
      id: `q${questionIndex}-opt${index}`,
      englishText: text,
      isCorrect: text === correct,
    }));

    const learningPointText = target.learningPoint?.text.trim() ?? "";

    questions.push({
      id: `q${questionIndex}`,
      vocabularyId: target.id,
      meaning: target.meaning,
      japaneseText: target.japaneseText,
      correctText: correct,
      ...(learningPointText
        ? {
            learningPoint: {
              text: learningPointText,
              meaning: target.learningPoint?.meaning.trim() ?? "",
            },
          }
        : {}),
      options,
    });
    questionIndex += 1;
  }

  return questions;
}
