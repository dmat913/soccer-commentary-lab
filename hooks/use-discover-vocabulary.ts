"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  isDiscoverPostSavedInVocabulary,
  isDiscoverVocabularyAddedInUi,
  mapDiscoverPostToVocabularyAddEntry,
} from "@/lib/discover/vocabulary-mapping";
import {
  createSavedPostIdSet,
  withSavedPostId,
} from "@/lib/discover/save-state";
import { getDiscoverRepository } from "@/lib/repositories";
import type { DiscoverPost } from "@/types/discover";

type UseDiscoverVocabularyOptions = {
  adjustSaveCount: (postId: string, delta: number) => void;
};

type UseDiscoverVocabularyResult = {
  isSaved: (post: DiscoverPost) => boolean;
  isUpdating: (postId: string) => boolean;
  addToVocabulary: (
    post: DiscoverPost
  ) => Promise<"added" | "already-saved" | "ignored">;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
};

const LOAD_ERROR_MESSAGE = "単語帳の追加状態を取得できませんでした。";
const ADD_ERROR_MESSAGE =
  "単語帳への追加に失敗しました。もう一度お試しください。";
const SAVE_COUNT_ERROR_MESSAGE =
  "単語帳への追加は完了しましたが、保存数の更新に失敗しました。";

export function useDiscoverVocabulary({
  adjustSaveCount,
}: UseDiscoverVocabularyOptions): UseDiscoverVocabularyResult {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { addVocabularyItem, isVocabularyItemSaved } = useVocabulary();
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(
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

    async function loadSavedState() {
      if (!userId) {
        if (!cancelled) {
          setSavedPostIds(new Set());
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const postIds =
          await getDiscoverRepository().listMySavedPostIds(userId);
        if (!cancelled) {
          setSavedPostIds(createSavedPostIdSet(postIds));
        }
      } catch {
        if (!cancelled) {
          setSavedPostIds(new Set());
          setError(LOAD_ERROR_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSavedState();

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

  const isSaved = useCallback(
    (post: DiscoverPost) => {
      return isDiscoverVocabularyAddedInUi({
        isInVocabulary: isDiscoverPostSavedInVocabulary(
          isVocabularyItemSaved,
          post
        ),
        // Orphan saves are ignored for UI; still tracked for count sync after add.
        hasDiscoverSave: savedPostIds.has(post.id),
      });
    },
    [isVocabularyItemSaved, savedPostIds]
  );

  const isUpdating = useCallback(
    (postId: string) => pendingPostIds.has(postId),
    [pendingPostIds]
  );

  const addToVocabulary = useCallback(
    async (
      post: DiscoverPost
    ): Promise<"added" | "already-saved" | "ignored"> => {
      if (!post.id || pendingPostIds.has(post.id)) {
        return "ignored";
      }

      if (isSaved(post)) {
        return "already-saved";
      }

      setPending(post.id, true);
      setError(null);

      try {
        const entry = mapDiscoverPostToVocabularyAddEntry(post);
        if (!entry.englishText) {
          toast.error(ADD_ERROR_MESSAGE);
          return "ignored";
        }

        addVocabularyItem(entry);

        if (!userId) {
          return "added";
        }

        try {
          const result = await getDiscoverRepository().markPostAsSaved(
            post.id,
            userId
          );
          setSavedPostIds((current) =>
            withSavedPostId(current, post.id, true)
          );
          if (!result.alreadySaved) {
            adjustSaveCount(post.id, 1);
          }
        } catch {
          toast.error(SAVE_COUNT_ERROR_MESSAGE);
        }

        return "added";
      } catch {
        toast.error(ADD_ERROR_MESSAGE);
        return "ignored";
      } finally {
        setPending(post.id, false);
      }
    },
    [
      addVocabularyItem,
      adjustSaveCount,
      isSaved,
      pendingPostIds,
      setPending,
      userId,
    ]
  );

  return {
    isSaved,
    isUpdating,
    addToVocabulary,
    loading: authLoading || loading,
    error,
    isAuthenticated: userId !== null,
  };
}
