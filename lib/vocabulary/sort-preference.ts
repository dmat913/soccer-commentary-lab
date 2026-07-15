import {
  isVocabularySortOption,
  type VocabularySortOption,
} from "@/lib/vocabulary/display";

export const VOCABULARY_SORT_OPTION_KEY = "vocabulary-sort-option";

export const DEFAULT_VOCABULARY_SORT_OPTION: VocabularySortOption =
  "recently-added";

const listeners = new Set<() => void>();
let memorySnapshot: VocabularySortOption | null = null;

function notifyVocabularySortPreferenceListeners() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Reads the persisted Vocabulary sort preference from localStorage.
 * Safe for SSR (returns the default) and invalid/corrupt values.
 */
export function getStoredVocabularySortOption(): VocabularySortOption {
  if (typeof window === "undefined") {
    return DEFAULT_VOCABULARY_SORT_OPTION;
  }

  try {
    const raw = localStorage.getItem(VOCABULARY_SORT_OPTION_KEY);
    if (raw === null || raw === "") {
      return DEFAULT_VOCABULARY_SORT_OPTION;
    }
    if (isVocabularySortOption(raw)) {
      return raw;
    }
    return DEFAULT_VOCABULARY_SORT_OPTION;
  } catch {
    return DEFAULT_VOCABULARY_SORT_OPTION;
  }
}

/**
 * Persists the Vocabulary sort preference. Failures are swallowed so the UI
 * can keep sorting in memory.
 */
export function setStoredVocabularySortOption(
  option: VocabularySortOption
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(VOCABULARY_SORT_OPTION_KEY, option);
  } catch {
    // private mode / quota — leave in-memory sort intact
  }
}

export function subscribeVocabularySortPreference(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot for useSyncExternalStore (reads localStorage once, then memory). */
export function getVocabularySortPreferenceSnapshot(): VocabularySortOption {
  if (memorySnapshot === null) {
    memorySnapshot = getStoredVocabularySortOption();
  }
  return memorySnapshot;
}

export function getServerVocabularySortPreferenceSnapshot(): VocabularySortOption {
  return DEFAULT_VOCABULARY_SORT_OPTION;
}

/** Clears the in-memory snapshot (for unit tests). */
export function resetVocabularySortPreferenceMemory(): void {
  memorySnapshot = null;
}

/** Updates memory + localStorage and notifies subscribers (same-tab). */
export function setVocabularySortPreference(
  option: VocabularySortOption
): void {
  memorySnapshot = option;
  setStoredVocabularySortOption(option);
  notifyVocabularySortPreferenceListeners();
}
