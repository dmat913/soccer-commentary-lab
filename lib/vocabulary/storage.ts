import type { CommentaryLearningPoint } from "@/types/commentary";
import {
  applyVocabularyAnswer,
  DEFAULT_VOCABULARY_LEARNING_STATE,
  markVocabularyStillLearning,
  normalizeVocabularyLearningState,
} from "@/lib/vocabulary/learning";
import type { VocabularyAddEntry, VocabularyItem } from "@/types/vocabulary";

const STORAGE_KEY = "vocabulary-items";
const EMPTY_ITEMS: VocabularyItem[] = [];

const vocabularyListeners = new Set<() => void>();
let cachedSnapshot: VocabularyItem[] | null = null;

function notifyVocabularyListeners() {
  for (const listener of vocabularyListeners) {
    listener();
  }
}

export function subscribeVocabularyItems(listener: () => void): () => void {
  vocabularyListeners.add(listener);
  return () => {
    vocabularyListeners.delete(listener);
  };
}

function isLearningPoint(value: unknown): value is CommentaryLearningPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const point = value as Record<string, unknown>;
  return typeof point.text === "string" && typeof point.meaning === "string";
}

/**
 * Parses a raw vocabulary record (including legacy localStorage rows missing
 * learning fields). Prefers keeping the item over dropping it.
 */
export function parseVocabularyItem(value: unknown): VocabularyItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.englishText !== "string") {
    return null;
  }

  if (item.learningPoint !== undefined && !isLearningPoint(item.learningPoint)) {
    return null;
  }

  const learning = normalizeVocabularyLearningState(item);

  return {
    id: item.id,
    englishText: item.englishText,
    meaning: typeof item.meaning === "string" ? item.meaning : "",
    japaneseText: typeof item.japaneseText === "string" ? item.japaneseText : "",
    ...(item.learningPoint && isLearningPoint(item.learningPoint)
      ? { learningPoint: item.learningPoint }
      : {}),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    status: learning.status,
    correctStreak: learning.correctStreak,
    ...(learning.lastReviewedAt
      ? { lastReviewedAt: learning.lastReviewedAt }
      : {}),
  };
}

function readVocabularyFromStorage(): VocabularyItem[] {
  if (typeof window === "undefined") {
    return EMPTY_ITEMS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_ITEMS;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return EMPTY_ITEMS;
    }

    const items = parsed
      .map(parseVocabularyItem)
      .filter((item): item is VocabularyItem => item !== null);
    return items.length > 0 ? items : EMPTY_ITEMS;
  } catch {
    return EMPTY_ITEMS;
  }
}

export function getVocabularyItemsSnapshot(): VocabularyItem[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readVocabularyFromStorage();
  }

  return cachedSnapshot;
}

export function getServerVocabularyItemsSnapshot(): VocabularyItem[] {
  return EMPTY_ITEMS;
}

export function isVocabularyItemSaved(englishText: string): boolean {
  const normalized = englishText.trim();
  if (!normalized) {
    return false;
  }

  return getVocabularyItemsSnapshot().some(
    (item) => item.englishText.trim() === normalized
  );
}

function persistVocabulary(items: VocabularyItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  cachedSnapshot = items.length > 0 ? items : EMPTY_ITEMS;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (private mode / quota). Keep the
    // in-memory snapshot so the current tab stays consistent.
  }

  notifyVocabularyListeners();
}

export function addVocabularyItem(entry: VocabularyAddEntry): VocabularyItem[] {
  const englishText = entry.englishText.trim();

  if (!englishText) {
    return getVocabularyItemsSnapshot();
  }

  const snapshot = getVocabularyItemsSnapshot();
  const current = snapshot === EMPTY_ITEMS ? [] : [...snapshot];

  const alreadySaved = current.some(
    (item) => item.englishText.trim() === englishText
  );

  if (alreadySaved) {
    return getVocabularyItemsSnapshot();
  }

  const newItem: VocabularyItem = {
    id: crypto.randomUUID(),
    englishText,
    meaning: entry.meaning.trim(),
    japaneseText: entry.japaneseText.trim(),
    ...(entry.learningPoint ? { learningPoint: entry.learningPoint } : {}),
    createdAt: new Date().toISOString(),
    status: DEFAULT_VOCABULARY_LEARNING_STATE.status,
    correctStreak: DEFAULT_VOCABULARY_LEARNING_STATE.correctStreak,
  };

  persistVocabulary([newItem, ...current]);

  return getVocabularyItemsSnapshot();
}

export function removeVocabularyItem(id: string): VocabularyItem[] {
  const snapshot = getVocabularyItemsSnapshot();
  const current = snapshot === EMPTY_ITEMS ? [] : [...snapshot];
  const updated = current.filter((item) => item.id !== id);

  if (updated.length === current.length) {
    return getVocabularyItemsSnapshot();
  }

  persistVocabulary(updated);

  return getVocabularyItemsSnapshot();
}

function updateItemLearningById(
  id: string,
  nextLearning: ReturnType<typeof applyVocabularyAnswer>
): VocabularyItem[] {
  const snapshot = getVocabularyItemsSnapshot();
  const current = snapshot === EMPTY_ITEMS ? [] : [...snapshot];
  const index = current.findIndex((item) => item.id === id);

  if (index < 0) {
    return getVocabularyItemsSnapshot();
  }

  const existing = current[index];
  const updated: VocabularyItem = {
    ...existing,
    status: nextLearning.status,
    correctStreak: nextLearning.correctStreak,
    ...(nextLearning.lastReviewedAt
      ? { lastReviewedAt: nextLearning.lastReviewedAt }
      : {}),
  };

  if (!nextLearning.lastReviewedAt) {
    delete updated.lastReviewedAt;
  }

  const next = [...current];
  next[index] = updated;
  persistVocabulary(next);

  return getVocabularyItemsSnapshot();
}

export function applyVocabularyAnswerById(
  id: string,
  isCorrect: boolean
): VocabularyItem[] {
  const snapshot = getVocabularyItemsSnapshot();
  const item = snapshot.find((entry) => entry.id === id);
  if (!item) {
    return getVocabularyItemsSnapshot();
  }

  return updateItemLearningById(
    id,
    applyVocabularyAnswer(item, isCorrect)
  );
}

export function markVocabularyStillLearningById(id: string): VocabularyItem[] {
  const snapshot = getVocabularyItemsSnapshot();
  const item = snapshot.find((entry) => entry.id === id);
  if (!item || item.status !== "mastered") {
    return getVocabularyItemsSnapshot();
  }

  return updateItemLearningById(id, markVocabularyStillLearning(item));
}
