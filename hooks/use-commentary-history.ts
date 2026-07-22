"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { syncLocalHistoryToSupabase } from "@/lib/history/sync";
import { getHistoryRepository } from "@/lib/repositories";
import { isSupabaseHistoryRepository } from "@/lib/repositories/history.supabase";
import type { HistoryAddEntry } from "@/lib/repositories/types";
import type { CommentaryHistoryItem } from "@/types/history";

const remoteLoadingListeners = new Set<() => void>();
let remoteHistoryLoading = false;
const completedRemoteHistoryLoads = new Set<string>();

function setRemoteHistoryLoading(next: boolean) {
  if (remoteHistoryLoading === next) {
    return;
  }
  remoteHistoryLoading = next;
  for (const listener of remoteLoadingListeners) {
    listener();
  }
}

function markRemoteHistoryLoadComplete(userId: string) {
  completedRemoteHistoryLoads.add(userId);
  remoteHistoryLoading = false;
  for (const listener of remoteLoadingListeners) {
    listener();
  }
}

function subscribeRemoteHistoryLoading(listener: () => void) {
  remoteLoadingListeners.add(listener);
  return () => {
    remoteLoadingListeners.delete(listener);
  };
}

/**
 * True while auth is unresolved or a signed-in remote history fetch is in flight.
 * Used to avoid flashing the empty state before sync completes.
 */
export function useCommentaryHistoryLoading(): boolean {
  const { user, isLoading: authLoading } = useAuth();
  const remoteLoading = useSyncExternalStore(
    subscribeRemoteHistoryLoading,
    () => remoteHistoryLoading,
    () => true
  );

  if (authLoading) {
    return true;
  }
  if (user?.id) {
    if (!completedRemoteHistoryLoads.has(user.id)) {
      return true;
    }
    return remoteLoading;
  }
  return false;
}

export function useCommentaryHistory(): CommentaryHistoryItem[] {
  const { user } = useAuth();
  const repository = useMemo(
    () => getHistoryRepository(user?.id ?? null),
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id || !isSupabaseHistoryRepository(repository)) {
      setRemoteHistoryLoading(false);
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;
    setRemoteHistoryLoading(true);

    async function loadHistory() {
      try {
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
      } finally {
        if (!cancelled) {
          markRemoteHistoryLoadComplete(userId);
        }
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
