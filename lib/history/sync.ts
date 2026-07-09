import { localHistoryRepository } from "@/lib/repositories/history.local";
import type { SupabaseHistoryRepository } from "@/lib/repositories/history.supabase";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import type { CommentaryHistoryItem } from "@/types/history";

function getHistorySyncedKey(userId: string): string {
  return `history-synced-user-${userId}`;
}

export function isHistorySynced(userId: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return localStorage.getItem(getHistorySyncedKey(userId)) === "true";
}

function markHistorySynced(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getHistorySyncedKey(userId), "true");
}

export function getHistoryDedupeKey(item: CommentaryHistoryItem): string | null {
  const japaneseText = item.japaneseText.trim();
  const candidateTexts = item.translations
    .map((translation) => translation.text.trim())
    .filter(Boolean);

  if (!japaneseText || candidateTexts.length === 0) {
    return null;
  }

  return JSON.stringify({
    japaneseText,
    candidateTexts,
  });
}

export type SyncLocalHistoryResult = {
  inserted: number;
  skipped: boolean;
};

/**
 * Merges localStorage history into Supabase for the given user.
 * Does not delete local or remote data. Dedupes by japaneseText and candidate text array.
 * Sets the synced flag only after all inserts succeed.
 */
export async function syncLocalHistoryToSupabase(
  userId: string,
  supabaseRepo: SupabaseHistoryRepository
): Promise<SyncLocalHistoryResult> {
  if (typeof window === "undefined") {
    return { inserted: 0, skipped: true };
  }

  if (isHistorySynced(userId)) {
    return { inserted: 0, skipped: true };
  }

  try {
    const localHistory = localHistoryRepository.getSnapshot();
    const remoteHistory = await supabaseRepo.fetchAll();
    const seenKeys = new Set(
      remoteHistory
        .map(getHistoryDedupeKey)
        .filter((key): key is string => key !== null)
    );

    const toInsert: CommentaryHistoryItem[] = [];

    for (const item of localHistory) {
      const key = getHistoryDedupeKey(item);
      if (!key || seenKeys.has(key)) {
        continue;
      }

      seenKeys.add(key);
      toInsert.push(item);
    }

    for (const item of toInsert) {
      await supabaseRepo.insertHistoryItem(item);
    }

    await supabaseRepo.fetchAll();
    markHistorySynced(userId);

    return { inserted: toInsert.length, skipped: false };
  } catch (error) {
    logSupabaseRepositoryError(
      "[syncLocalHistoryToSupabase] sync failed",
      error,
      {
        userId,
        tableName: "commentary_history",
        operation: "sync",
      }
    );
    throw error;
  }
}
