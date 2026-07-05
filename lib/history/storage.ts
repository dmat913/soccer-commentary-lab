import { resolveLearningPoint } from "@/lib/commentary/learning-point";
import type { CommentaryTranslationItem } from "@/types/commentary";
import type {
  CommentaryHistoryItem,
  StoredHistoryTranslation,
} from "@/types/history";

const STORAGE_KEY = "soccer-commentary-history";
const MAX_ITEMS = 10;
const EMPTY_HISTORY: CommentaryHistoryItem[] = [];

const historyListeners = new Set<() => void>();
let cachedSnapshot: CommentaryHistoryItem[] | null = null;

function notifyHistoryListeners() {
  for (const listener of historyListeners) {
    listener();
  }
}

export function subscribeCommentaryHistory(listener: () => void): () => void {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

function isStoredHistoryTranslation(
  value: unknown
): value is StoredHistoryTranslation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  const learningPoint = item.learningPoint;
  const vocabulary = item.vocabulary;

  const hasLearningPoint =
    learningPoint === undefined ||
    (typeof learningPoint === "object" &&
      learningPoint !== null &&
      typeof (learningPoint as Record<string, unknown>).text === "string" &&
      typeof (learningPoint as Record<string, unknown>).meaning === "string");

  const hasLegacyVocabulary =
    vocabulary === undefined ||
    (typeof vocabulary === "object" &&
      vocabulary !== null &&
      typeof (vocabulary as Record<string, unknown>).word === "string" &&
      typeof (vocabulary as Record<string, unknown>).meaning === "string");

  return (
    typeof item.text === "string" &&
    typeof item.meaning === "string" &&
    (item.explanation === undefined || typeof item.explanation === "string") &&
    hasLearningPoint &&
    hasLegacyVocabulary
  );
}

export function normalizeHistoryTranslation(
  raw: StoredHistoryTranslation
): CommentaryTranslationItem | null {
  const text = raw.text.trim();
  const meaning = raw.meaning.trim();

  if (!text || !meaning) {
    return null;
  }

  return {
    text,
    meaning,
    explanation: raw.explanation?.trim() ?? "",
    learningPoint: resolveLearningPoint({
      learningPoint: raw.learningPoint,
      vocabulary: raw.vocabulary,
    }),
  };
}

function normalizeHistoryItem(raw: unknown): CommentaryHistoryItem | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const item = raw as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.japaneseText !== "string" ||
    typeof item.savedAt !== "string" ||
    !Array.isArray(item.translations)
  ) {
    return null;
  }

  const translations = item.translations
    .filter(isStoredHistoryTranslation)
    .map(normalizeHistoryTranslation)
    .filter((translation): translation is CommentaryTranslationItem => {
      return translation !== null;
    });

  if (translations.length === 0) {
    return null;
  }

  return {
    id: item.id,
    japaneseText: item.japaneseText,
    savedAt: item.savedAt,
    translations,
  };
}

function readHistoryFromStorage(): CommentaryHistoryItem[] {
  if (typeof window === "undefined") {
    return EMPTY_HISTORY;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_HISTORY;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return EMPTY_HISTORY;
    }

    const items = parsed
      .map(normalizeHistoryItem)
      .filter((item): item is CommentaryHistoryItem => item !== null);

    return items.length > 0 ? items : EMPTY_HISTORY;
  } catch {
    return EMPTY_HISTORY;
  }
}

export function getCommentaryHistorySnapshot(): CommentaryHistoryItem[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readHistoryFromStorage();
  }

  return cachedSnapshot;
}

export function loadCommentaryHistory(): CommentaryHistoryItem[] {
  return getCommentaryHistorySnapshot();
}

export function addCommentaryHistory(entry: {
  japaneseText: string;
  translations: CommentaryTranslationItem[];
}): CommentaryHistoryItem[] {
  const newItem: CommentaryHistoryItem = {
    id: crypto.randomUUID(),
    japaneseText: entry.japaneseText,
    translations: entry.translations,
    savedAt: new Date().toISOString(),
  };

  const current = getCommentaryHistorySnapshot();
  const updated = [newItem, ...(current === EMPTY_HISTORY ? [] : current)].slice(
    0,
    MAX_ITEMS
  );

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    cachedSnapshot = updated;
    notifyHistoryListeners();
  }

  return updated;
}

export function getServerCommentaryHistorySnapshot(): CommentaryHistoryItem[] {
  return EMPTY_HISTORY;
}
