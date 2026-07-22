"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  createHeardPostIdSet,
  isPostHeard,
  withHeardPostId,
  type ApplyHeardCountDeltaOptions,
} from "@/lib/discover/heard-state";
import { getDiscoverRepository } from "@/lib/repositories";

type UseDiscoverHeardOptions = {
  adjustHeardCount: (
    postId: string,
    delta: number,
    options?: ApplyHeardCountDeltaOptions
  ) => void;
  restoreHeardCount: (
    postId: string,
    previousHeardCount: number,
    previousRecentHeardCount?: number
  ) => void;
  getHeardCount: (postId: string) => number | undefined;
  getRecentHeardCount: (postId: string) => number | undefined;
  refreshPosts: () => Promise<void>;
};

type UseDiscoverHeardResult = {
  heardPostIds: ReadonlySet<string>;
  isHeard: (postId: string) => boolean;
  isUpdating: (postId: string) => boolean;
  toggleHeard: (postId: string) => Promise<"toggled" | "login-required" | "ignored">;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
};

const LOAD_ERROR_MESSAGE = "「聞いたことある」の状態を取得できませんでした。";
const TOGGLE_ERROR_MESSAGE = "反応の更新に失敗しました。もう一度お試しください。";

export function useDiscoverHeard({
  adjustHeardCount,
  restoreHeardCount,
  getHeardCount,
  getRecentHeardCount,
  refreshPosts,
}: UseDiscoverHeardOptions): UseDiscoverHeardResult {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [heardPostIds, setHeardPostIds] = useState<Set<string>>(
    () => new Set()
  );
  /** Posts marked heard during this page session (safe to adjust recentHeardCount on undo). */
  const [sessionHeardPostIds, setSessionHeardPostIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingPostIds, setPendingPostIds] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return;
    }

    async function loadHeardState() {
      if (!userId) {
        if (!cancelled) {
          setHeardPostIds(new Set());
          setSessionHeardPostIds(new Set());
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const postIds = await getDiscoverRepository().listMyHeardPostIds(userId);
        if (!cancelled) {
          setHeardPostIds(createHeardPostIdSet(postIds));
          setSessionHeardPostIds(new Set());
        }
      } catch {
        if (!cancelled) {
          setHeardPostIds(new Set());
          setSessionHeardPostIds(new Set());
          setError(LOAD_ERROR_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHeardState();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const setPending = useCallback((postId: string, pending: boolean) => {
    setPendingPostIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }, []);

  const toggleHeard = useCallback(
    async (postId: string): Promise<"toggled" | "login-required" | "ignored"> => {
      if (!userId) {
        return "login-required";
      }

      if (!postId || pendingPostIds.has(postId)) {
        return "ignored";
      }

      const previousHeardCount = getHeardCount(postId);
      const previousRecentHeardCount = getRecentHeardCount(postId);
      if (
        previousHeardCount === undefined ||
        previousRecentHeardCount === undefined
      ) {
        return "ignored";
      }

      const wasHeard = isPostHeard(heardPostIds, postId);
      const delta = wasHeard ? -1 : 1;
      const adjustRecent = wasHeard
        ? sessionHeardPostIds.has(postId)
        : true;

      setPending(postId, true);
      setHeardPostIds((current) => withHeardPostId(current, postId, !wasHeard));
      adjustHeardCount(postId, delta, { adjustRecent });

      if (!wasHeard) {
        setSessionHeardPostIds((current) =>
          withHeardPostId(current, postId, true)
        );
      } else if (adjustRecent) {
        setSessionHeardPostIds((current) =>
          withHeardPostId(current, postId, false)
        );
      }

      try {
        if (wasHeard) {
          await getDiscoverRepository().unmarkPostAsHeard(postId, userId);
          if (!adjustRecent) {
            await refreshPosts();
          }
        } else {
          await getDiscoverRepository().markPostAsHeard(postId, userId);
        }
        return "toggled";
      } catch {
        setHeardPostIds((current) => withHeardPostId(current, postId, wasHeard));
        setSessionHeardPostIds((current) =>
          withHeardPostId(current, postId, wasHeard && adjustRecent)
        );
        restoreHeardCount(
          postId,
          previousHeardCount,
          previousRecentHeardCount
        );
        toast.error(TOGGLE_ERROR_MESSAGE);
        return "ignored";
      } finally {
        setPending(postId, false);
      }
    },
    [
      adjustHeardCount,
      getHeardCount,
      getRecentHeardCount,
      heardPostIds,
      pendingPostIds,
      refreshPosts,
      restoreHeardCount,
      sessionHeardPostIds,
      setPending,
      userId,
    ]
  );

  const isHeard = useCallback(
    (postId: string) => isPostHeard(heardPostIds, postId),
    [heardPostIds]
  );

  const isUpdating = useCallback(
    (postId: string) => pendingPostIds.has(postId),
    [pendingPostIds]
  );

  return {
    heardPostIds,
    isHeard,
    isUpdating,
    toggleHeard,
    loading: authLoading || loading,
    error,
    isAuthenticated: userId !== null,
  };
}
