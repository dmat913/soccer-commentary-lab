"use client";

import { useCallback, useEffect, useState } from "react";

import {
  applyHeardCountDeltaToPosts,
  restoreHeardCountOnPosts,
  type ApplyHeardCountDeltaOptions,
} from "@/lib/discover/heard-state";
import { removeDiscoverPostFromList } from "@/lib/discover/ownership";
import {
  applySaveCountDeltaToPosts,
  restoreSaveCountOnPosts,
} from "@/lib/discover/save-state";
import { getDiscoverRepository } from "@/lib/repositories";
import type { DiscoverPost } from "@/types/discover";

type UseDiscoverResult = {
  posts: DiscoverPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removePost: (postId: string) => DiscoverPost | undefined;
  restorePost: (post: DiscoverPost) => void;
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
  adjustSaveCount: (postId: string, delta: number) => void;
  restoreSaveCount: (postId: string, previousCount: number) => void;
};

const LOAD_ERROR_MESSAGE =
  "通信状態を確認して、もう一度お試しください。";

export function useDiscover(): UseDiscoverResult {
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getDiscoverRepository().listPosts();
      setPosts(next);
    } catch {
      setError(LOAD_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustHeardCount = useCallback(
    (
      postId: string,
      delta: number,
      options?: ApplyHeardCountDeltaOptions
    ) => {
      setPosts((current) =>
        applyHeardCountDeltaToPosts(current, postId, delta, options)
      );
    },
    []
  );

  const restoreHeardCount = useCallback(
    (
      postId: string,
      previousHeardCount: number,
      previousRecentHeardCount?: number
    ) => {
      setPosts((current) =>
        restoreHeardCountOnPosts(
          current,
          postId,
          previousHeardCount,
          previousRecentHeardCount
        )
      );
    },
    []
  );

  const adjustSaveCount = useCallback((postId: string, delta: number) => {
    setPosts((current) => applySaveCountDeltaToPosts(current, postId, delta));
  }, []);

  const restoreSaveCount = useCallback(
    (postId: string, previousCount: number) => {
      setPosts((current) =>
        restoreSaveCountOnPosts(current, postId, previousCount)
      );
    },
    []
  );

  const removePost = useCallback((postId: string) => {
    let removed: DiscoverPost | undefined;
    setPosts((current) => {
      removed = current.find((post) => post.id === postId);
      return removeDiscoverPostFromList(current, postId);
    });
    return removed;
  }, []);

  const restorePost = useCallback((post: DiscoverPost) => {
    setPosts((current) => {
      if (current.some((item) => item.id === post.id)) {
        return current;
      }
      return [post, ...current];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const next = await getDiscoverRepository().listPosts();
        if (cancelled) {
          return;
        }
        setPosts(next);
      } catch {
        if (cancelled) {
          return;
        }
        setError(LOAD_ERROR_MESSAGE);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    posts,
    loading,
    error,
    refresh,
    removePost,
    restorePost,
    adjustHeardCount,
    restoreHeardCount,
    adjustSaveCount,
    restoreSaveCount,
  };
}
