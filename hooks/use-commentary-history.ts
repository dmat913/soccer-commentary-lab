"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { syncLocalHistoryToSupabase } from "@/lib/history/sync";
import { getHistoryRepository } from "@/lib/repositories";
import { isSupabaseHistoryRepository } from "@/lib/repositories/history.supabase";
import type { HistoryAddEntry } from "@/lib/repositories/types";
import type { CommentaryHistoryItem } from "@/types/history";

export function useCommentaryHistory(): CommentaryHistoryItem[] {
  const { user } = useAuth();
  const repository = useMemo(
    () => getHistoryRepository(user?.id ?? null),
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id || !isSupabaseHistoryRepository(repository)) {
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;

    async function loadHistory() {
      try {
        await syncLocalHistoryToSupabase(userId, supabaseRepo);
      } catch {
        // Sync errors are logged inside syncLocalHistoryToSupabase.
        // Do not set the synced flag; still try to load remote history.
      }

      if (cancelled) {
        return;
      }

      try {
        await supabaseRepo.fetchAll();
      } catch {
        // fetchAll logs its own error details.
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user?.id, repository]);

  return useSyncExternalStore(
    repository.subscribe.bind(repository),
    repository.getSnapshot.bind(repository),
    repository.getServerSnapshot.bind(repository)
  );
}

export function addHistory(
  entry: HistoryAddEntry,
  userId?: string | null
): CommentaryHistoryItem[] {
  return getHistoryRepository(userId ?? null).add(entry);
}

export function removeHistory(
  id: string,
  userId?: string | null
): CommentaryHistoryItem[] {
  const repository = getHistoryRepository(userId ?? null);

  if (isSupabaseHistoryRepository(repository)) {
    void repository.removeHistory(id);
    return repository.getSnapshot();
  }

  return repository.remove(id);
}
