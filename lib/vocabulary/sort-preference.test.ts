import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import { sortVocabularyItems } from "@/lib/vocabulary/display";
import {
  DEFAULT_VOCABULARY_SORT_OPTION,
  getStoredVocabularySortOption,
  getVocabularySortPreferenceSnapshot,
  resetVocabularySortPreferenceMemory,
  setStoredVocabularySortOption,
  setVocabularySortPreference,
  VOCABULARY_SORT_OPTION_KEY,
} from "@/lib/vocabulary/sort-preference";
import type { VocabularyItem } from "@/types/vocabulary";

type StorageMap = Map<string, string>;

function installLocalStorageMock(store: StorageMap): void {
  const localStorageMock = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: globalThis,
  });
}

describe("vocabulary sort preference storage", () => {
  const store: StorageMap = new Map();
  let originalLocalStorage: PropertyDescriptor | undefined;
  let originalWindow: PropertyDescriptor | undefined;

  beforeEach(() => {
    store.clear();
    resetVocabularySortPreferenceMemory();
    originalLocalStorage = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage"
    );
    originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    installLocalStorageMock(store);
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("accepts the four allowed sort options", () => {
    for (const option of [
      "recently-added",
      "recently-reviewed",
      "learning-first",
      "a-z",
    ] as const) {
      setStoredVocabularySortOption(option);
      assert.equal(getStoredVocabularySortOption(), option);
      assert.equal(store.get(VOCABULARY_SORT_OPTION_KEY), option);
    }
  });

  it("falls back to recently-added for invalid or empty values", () => {
    store.set(VOCABULARY_SORT_OPTION_KEY, "oldest-first");
    assert.equal(getStoredVocabularySortOption(), DEFAULT_VOCABULARY_SORT_OPTION);

    store.set(VOCABULARY_SORT_OPTION_KEY, "");
    assert.equal(getStoredVocabularySortOption(), DEFAULT_VOCABULARY_SORT_OPTION);

    store.set(VOCABULARY_SORT_OPTION_KEY, "{bad");
    assert.equal(getStoredVocabularySortOption(), DEFAULT_VOCABULARY_SORT_OPTION);
  });

  it("falls back when no value is stored", () => {
    assert.equal(getStoredVocabularySortOption(), DEFAULT_VOCABULARY_SORT_OPTION);
  });

  it("falls back when localStorage throws on read", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {},
        removeItem() {},
        clear() {},
      },
    });
    assert.equal(getStoredVocabularySortOption(), DEFAULT_VOCABULARY_SORT_OPTION);
  });

  it("swallows write errors without throwing", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          return null;
        },
        setItem() {
          throw new Error("quota");
        },
        removeItem() {},
        clear() {},
      },
    });
    assert.doesNotThrow(() =>
      setStoredVocabularySortOption("learning-first")
    );
  });

  it("passes a restored value through to sortVocabularyItems", () => {
    setStoredVocabularySortOption("a-z");
    const option = getStoredVocabularySortOption();
    const items: VocabularyItem[] = [
      {
        id: "2",
        englishText: "zebra",
        meaning: "",
        japaneseText: "",
        createdAt: "2026-07-01T00:00:00.000Z",
        status: "new",
        correctStreak: 0,
      },
      {
        id: "1",
        englishText: "apple",
        meaning: "",
        japaneseText: "",
        createdAt: "2026-07-01T00:00:00.000Z",
        status: "new",
        correctStreak: 0,
      },
    ];
    assert.deepEqual(
      sortVocabularyItems(items, option).map((item) => item.id),
      ["1", "2"]
    );
  });

  it("updates the in-memory snapshot used by useSyncExternalStore", () => {
    setVocabularySortPreference("learning-first");
    assert.equal(
      getVocabularySortPreferenceSnapshot(),
      "learning-first"
    );
    assert.equal(store.get(VOCABULARY_SORT_OPTION_KEY), "learning-first");
  });
});
