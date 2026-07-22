"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  findPublishedPostByEnglishText,
  normalizeDiscoverEnglishText,
} from "@/lib/discover/supabase-mapping";
import { canPublishFavoriteToDiscover } from "@/lib/favorites/supabase-mapping";
import { getDiscoverRepository } from "@/lib/repositories";
import type {
  DiscoverPublishedPost,
  DiscoverPublishResult,
} from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";

const LOAD_ERROR_MESSAGE = "公開状態を取得できませんでした。";

export function useDiscoverPublishing() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [publishedPosts, setPublishedPosts] = useState<
    DiscoverPublishedPost[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingEnglishTexts, setPendingEnglishTexts] = useState<Set<string>>(
    () => new Set()
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setPublishedPosts([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setPublishedPosts(
        await getDiscoverRepository().listMyPosts(userId)
      );
    } catch {
      setError(LOAD_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return;
    }

    async function loadPublishedPosts() {
      if (!userId) {
        if (!cancelled) {
          setPublishedPosts([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const next = await getDiscoverRepository().listMyPosts(userId);
        if (!cancelled) {
          setPublishedPosts(next);
        }
      } catch {
        if (!cancelled) {
          setError(LOAD_ERROR_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPublishedPosts();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const publishedByEnglishText = useMemo(
    () =>
      new Map(
        publishedPosts.map((post) => [
          normalizeDiscoverEnglishText(post.englishText),
          post,
        ])
      ),
    [publishedPosts]
  );

  const myPublishedPostIds = useMemo(
    () => new Set(publishedPosts.map((post) => post.id)),
    [publishedPosts]
  );

  const setPending = useCallback((englishText: string, pending: boolean) => {
    const normalized = normalizeDiscoverEnglishText(englishText);
    setPendingEnglishTexts((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(normalized);
      } else {
        next.delete(normalized);
      }
      return next;
    });
  }, []);

  const publish = useCallback(
    async (favorite: FavoriteTranslation): Promise<DiscoverPublishResult> => {
      if (!userId) {
        throw new Error("Discoverへの公開にはログインが必要です。");
      }
      if (!canPublishFavoriteToDiscover(favorite)) {
        throw new Error("公開に必要な情報が不足しています。");
      }

      const existing = findPublishedPostByEnglishText(
        publishedPosts,
        favorite.text
      );
      if (existing) {
        return { post: existing, alreadyPublished: true };
      }

      setPending(favorite.text, true);
      try {
        const result = await getDiscoverRepository().publishPost(
          favorite,
          userId
        );
        setPublishedPosts((current) => {
          const duplicate = findPublishedPostByEnglishText(
            current,
            result.post.englishText
          );
          return duplicate ? current : [result.post, ...current];
        });
        return result;
      } finally {
        setPending(favorite.text, false);
      }
    },
    [publishedPosts, setPending, userId]
  );

  const unpublish = useCallback(
    async (post: DiscoverPublishedPost): Promise<void> => {
      if (!userId) {
        throw new Error("公開の取り消しにはログインが必要です。");
      }

      setPending(post.englishText, true);
      try {
        await getDiscoverRepository().deletePost(post.id, userId);
        setPublishedPosts((current) =>
          current.filter((item) => item.id !== post.id)
        );
      } finally {
        setPending(post.englishText, false);
      }
    },
    [setPending, userId]
  );

  const isPending = useCallback(
    (englishText: string) =>
      pendingEnglishTexts.has(normalizeDiscoverEnglishText(englishText)),
    [pendingEnglishTexts]
  );

  return {
    user,
    publishedByEnglishText,
    myPublishedPostIds,
    loading: authLoading || loading,
    error,
    refresh,
    publish,
    unpublish,
    isPending,
  };
}
