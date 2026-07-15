import { localVocabularyRepository } from "@/lib/repositories/vocabulary.local";
import type { SupabaseVocabularyRepository } from "@/lib/repositories/vocabulary.supabase";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import {
  mergeVocabularyLearningState,
  vocabularyLearningStatesEqual,
} from "@/lib/vocabulary/learning";
import type { VocabularyItem } from "@/types/vocabulary";

function getVocabularySyncedKey(userId: string): string {
  // Bumped so existing users re-run sync once and merge learning fields.
  return `vocabulary-synced-user-${userId}-learning-v1`;
}

export function isVocabularySynced(userId: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return localStorage.getItem(getVocabularySyncedKey(userId)) === "true";
  } catch {
    // If the flag cannot be read, allow a retry rather than skipping forever.
    return false;
  }
}

function markVocabularySynced(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(getVocabularySyncedKey(userId), "true");
  } catch {
    // Ignore write failures; the sync will be retried on the next login.
  }
}

/** Match key for local↔remote vocabulary: trimmed englishText (case-sensitive). */
export function vocabularyEnglishMatchKey(englishText: string): string {
  return englishText.trim();
}

export type SyncLocalVocabularyResult = {
  inserted: number;
  updatedLearning: number;
  skipped: boolean;
};

/**
 * Merges localStorage vocabulary into Supabase for the given user.
 * Body text dedupes by trimmed englishText, preferring the existing remote row.
 * Learning state merges by lastReviewedAt (newer wins); never by status strength.
 * Sets the synced flag only after all writes and the final fetch succeed.
 */
export async function syncLocalVocabularyToSupabase(
  userId: string,
  supabaseRepo: SupabaseVocabularyRepository
): Promise<SyncLocalVocabularyResult> {
  if (typeof window === "undefined") {
    return { inserted: 0, updatedLearning: 0, skipped: true };
  }

  if (isVocabularySynced(userId)) {
    return { inserted: 0, updatedLearning: 0, skipped: true };
  }

  try {
    const localItems = localVocabularyRepository.getSnapshot();
    const remoteItems = await supabaseRepo.fetchAll();
    const remoteByText = new Map<string, VocabularyItem>();

    for (const item of remoteItems) {
      const key = vocabularyEnglishMatchKey(item.englishText);
      if (key && !remoteByText.has(key)) {
        remoteByText.set(key, item);
      }
    }

    let inserted = 0;
    let updatedLearning = 0;

    for (const local of localItems) {
      const key = vocabularyEnglishMatchKey(local.englishText);
      if (!key) {
        continue;
      }

      const remote = remoteByText.get(key);
      if (!remote) {
        await supabaseRepo.insertForSync({
          englishText: local.englishText,
          meaning: local.meaning,
          japaneseText: local.japaneseText,
          ...(local.learningPoint ? { learningPoint: local.learningPoint } : {}),
          createdAt: local.createdAt,
          status: local.status,
          correctStreak: local.correctStreak,
          ...(local.lastReviewedAt
            ? { lastReviewedAt: local.lastReviewedAt }
            : {}),
        });
        inserted += 1;
        continue;
      }

      const merged = mergeVocabularyLearningState(local, remote);
      if (!vocabularyLearningStatesEqual(merged, remote)) {
        await supabaseRepo.updateLearningForSync(remote.id, merged);
        updatedLearning += 1;
      }
    }

    await supabaseRepo.fetchAll();
    markVocabularySynced(userId);

    return { inserted, updatedLearning, skipped: false };
  } catch (error) {
    logSupabaseRepositoryError(
      "[syncLocalVocabularyToSupabase] sync failed",
      error,
      {
        userId,
        tableName: "vocabulary_items",
        operation: "sync",
      }
    );
    throw error;
  }
}
