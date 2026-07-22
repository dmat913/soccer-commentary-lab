"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertCircle, Ear, Search } from "lucide-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { LoginButton } from "@/components/auth/login-button";
import { DiscoverFeedCard } from "@/components/discover/feed-card";
import { DiscoverFeedCardSkeleton } from "@/components/discover/feed-card-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { useDiscover } from "@/hooks/use-discover";
import { useDiscoverHeard } from "@/hooks/use-discover-heard";
import { useDiscoverPublishing } from "@/hooks/use-discover-publishing";
import { useDiscoverVocabulary } from "@/hooks/use-discover-vocabulary";
import { isOwnedDiscoverPost } from "@/lib/discover/ownership";
import {
  filterDiscoverFeedPosts,
  isDiscoverCategoryFilter,
} from "@/lib/discover/category";
import { formatHeardCount } from "@/lib/discover/supabase-mapping";
import {
  sortDiscoverPosts,
  sortDiscoverPostsByMostHeard,
} from "@/lib/discover/sorting";
import {
  emptyStateIconClassName,
  microLabelClassName,
  pageHeaderClassName,
  pageMainWideClassName,
  pageShellClassName,
  pageSubtitleClassName,
  pageTitleClassName,
  pillActiveClassName,
  pillBaseClassName,
  pillIdleClassName,
  searchInputClassName,
  twoColumnLayoutClassName,
} from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";
import type {
  DiscoverCategoryFilter,
  DiscoverPost,
  DiscoverSortOption,
} from "@/types/discover";
import {
  DISCOVER_CATEGORIES,
  DISCOVER_CATEGORY_LABELS,
} from "@/types/discover";

const DiscoverAside = dynamic(
  () =>
    import("@/components/discover/discover-aside").then((mod) => ({
      default: mod.DiscoverAside,
    })),
  {
    ssr: false,
    loading: () => (
      <aside
        aria-hidden="true"
        className="hidden min-w-0 flex-col gap-3 lg:flex"
      />
    ),
  }
);

const DISCOVER_TABS: readonly { id: DiscoverSortOption; label: string }[] = [
  { id: "trending", label: "トレンド" },
  { id: "newest", label: "新着" },
  { id: "popular", label: "人気" },
] as const;

function toTrendingSidebarItems(posts: readonly DiscoverPost[]) {
  return posts.slice(0, 5).map((post) => ({
    id: post.id,
    label: post.englishText,
    value: `今週 ${formatHeardCount(post.recentHeardCount)}人`,
    secondaryValue: `累計 ${formatHeardCount(post.heardCount)}人`,
  }));
}

function toMostHeardSidebarItems(posts: readonly DiscoverPost[]) {
  return posts.slice(0, 5).map((post) => ({
    id: post.id,
    label: post.englishText,
    value: `${formatHeardCount(post.heardCount)}人`,
  }));
}

export default function DiscoverPage() {
  const searchInputId = useId();
  const categorySelectId = useId();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<DiscoverCategoryFilter>("all");
  const [activeTab, setActiveTab] = useState<DiscoverSortOption>("trending");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const focusedPostIdRef = useRef<string | null>(null);
  const {
    posts,
    loading,
    error,
    refresh,
    removePost,
    restorePost,
    adjustHeardCount,
    restoreHeardCount,
    adjustSaveCount,
  } = useDiscover();
  const {
    myPublishedPostIds,
    unpublish,
    isPending: isUnpublishPending,
  } = useDiscoverPublishing();

  const getHeardCount = useCallback(
    (postId: string) => posts.find((post) => post.id === postId)?.heardCount,
    [posts]
  );

  const getRecentHeardCount = useCallback(
    (postId: string) =>
      posts.find((post) => post.id === postId)?.recentHeardCount,
    [posts]
  );

  const {
    isHeard,
    isUpdating,
    toggleHeard,
    error: heardError,
  } = useDiscoverHeard({
    adjustHeardCount,
    restoreHeardCount,
    getHeardCount,
    getRecentHeardCount,
    refreshPosts: refresh,
  });

  const {
    isSaved: isVocabularySaved,
    isUpdating: isVocabularyUpdating,
    addToVocabulary,
    error: vocabularyError,
    isAuthenticated,
  } = useDiscoverVocabulary({
    adjustSaveCount,
  });

  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters =
    normalizedQuery.length > 0 || categoryFilter !== "all";

  // Shared trending order for feed (when unfiltered) and sidebar — one sort.
  const trendingSortedPosts = useMemo(
    () => sortDiscoverPosts(posts, "trending"),
    [posts]
  );

  const filteredPosts = useMemo(() => {
    if (!hasActiveFilters && activeTab === "trending") {
      return trendingSortedPosts;
    }
    return filterDiscoverFeedPosts(posts, {
      query,
      category: categoryFilter,
      sort: activeTab,
    });
  }, [
    activeTab,
    categoryFilter,
    hasActiveFilters,
    posts,
    query,
    trendingSortedPosts,
  ]);

  const trendingItems = useMemo(
    () => toTrendingSidebarItems(trendingSortedPosts),
    [trendingSortedPosts]
  );

  const mostHeardItems = useMemo(
    () => toMostHeardSidebarItems(sortDiscoverPostsByMostHeard(posts)),
    [posts]
  );

  const showEmptyFeed =
    !loading && !error && posts.length === 0 && !hasActiveFilters;
  const showSearchEmpty =
    !loading && !error && posts.length > 0 && filteredPosts.length === 0;

  const onToggleHeard = useCallback(
    (postId: string) => {
      void toggleHeard(postId).then((result) => {
        if (result === "login-required") {
          setLoginPromptOpen(true);
        }
      });
    },
    [toggleHeard]
  );

  const onAddToVocabulary = useCallback(
    (nextPost: DiscoverPost) => {
      void addToVocabulary(nextPost);
    },
    [addToVocabulary]
  );

  const handleUnpublish = useCallback(
    async (post: DiscoverPost) => {
      const removed = removePost(post.id);
      try {
        await unpublish({
          id: post.id,
          englishText: post.englishText,
          sourceFavoriteId: null,
          createdAt: post.createdAt,
        });
      } catch (error) {
        if (removed) {
          restorePost(removed);
        }
        throw error;
      }
    },
    [removePost, restorePost, unpublish]
  );

  useEffect(() => {
    if (loading || typeof window === "undefined") {
      return;
    }

    const postId = new URLSearchParams(window.location.search).get("post");
    if (!postId || focusedPostIdRef.current === postId) {
      return;
    }

    const exists = posts.some((post) => post.id === postId);
    if (!exists) {
      return;
    }

    focusedPostIdRef.current = postId;

    const highlightClasses = [
      "border-primary",
      "ring-2",
      "ring-primary/40",
    ] as const;

    let clearHighlight: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(`discover-post-${postId}`);
      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add(...highlightClasses);
      clearHighlight = window.setTimeout(() => {
        element.classList.remove(...highlightClasses);
      }, 3500);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (clearHighlight !== undefined) {
        window.clearTimeout(clearHighlight);
      }
    };
  }, [loading, posts]);

  return (
    <div className={pageShellClassName}>
      <main
        className={cn(pageMainWideClassName, "gap-4 sm:gap-5")}
      >
        <div className={cn(twoColumnLayoutClassName, "gap-5 lg:gap-6")}>
          <div className="flex min-w-0 flex-col gap-2.5 sm:gap-3">
            <FadeIn>
              <header className={cn(pageHeaderClassName, "space-y-1")}>
                <h1 className={pageTitleClassName}>Discover</h1>
                <p className={cn(pageSubtitleClassName, "text-[13px] sm:text-sm")}>
                  みんなが公開した実況表現を流し見して学習できます
                </p>
              </header>
            </FadeIn>

            <FadeIn className="space-y-2" delay={0.04}>
              <div className="relative w-full max-w-2xl">
                <label htmlFor={searchInputId} className="sr-only">
                  Discoverを検索
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="search"
                  inputMode="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="英語・日本語・Learning Point・Meaningで検索…"
                  className={cn(
                    searchInputClassName,
                    "h-9 rounded-xl border-border/70 bg-background pl-9 shadow-none"
                  )}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div
                  className="flex w-full min-w-0 flex-1 gap-1 rounded-full border border-border/70 bg-background p-0.5 sm:w-auto sm:max-w-md"
                  role="tablist"
                  aria-label="Discoverの並び"
                >
                  {DISCOVER_TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          pillBaseClassName,
                          "min-h-8 flex-1 rounded-full border-transparent px-2.5 py-1.5 text-[11px] sm:flex-none sm:px-3 sm:text-xs",
                          active ? pillActiveClassName : pillIdleClassName,
                          !active && "border-transparent bg-transparent"
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full min-w-0 sm:w-44 sm:shrink-0">
                  <label
                    htmlFor={categorySelectId}
                    className={cn(microLabelClassName, "mb-1 block")}
                  >
                    カテゴリ
                  </label>
                  <select
                    id={categorySelectId}
                    value={categoryFilter}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (!isDiscoverCategoryFilter(next)) {
                        return;
                      }
                      setCategoryFilter(next);
                    }}
                    aria-label="Discoverのカテゴリ"
                    className="flex h-9 w-full min-w-0 rounded-lg border border-border/70 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-input/30"
                  >
                    <option value="all">すべて</option>
                    {DISCOVER_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {DISCOVER_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FadeIn>

            <FadeIn className="space-y-2" delay={0.06}>
              <p className="px-0.5 text-[11px] text-muted-foreground tabular-nums">
                {loading
                  ? "読み込み中…"
                  : error && posts.length === 0
                    ? "—"
                    : `${filteredPosts.length}件の実況表現`}
              </p>

              {heardError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-3 py-2 text-xs text-muted-foreground dark:border-destructive/30 dark:bg-destructive/10"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-destructive/70"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    反応の読み込みに失敗しました。一覧は引き続き閲覧できます。
                  </span>
                </div>
              ) : null}

              {vocabularyError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-3 py-2 text-xs text-muted-foreground dark:border-destructive/30 dark:bg-destructive/10"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-destructive/70"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    単語帳の状態を確認できませんでした。一覧は引き続き閲覧できます。
                  </span>
                </div>
              ) : null}

              {loading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  <span className="sr-only">Discoverを読み込み中</span>
                  {[0, 1, 2].map((index) => (
                    <DiscoverFeedCardSkeleton key={index} index={index} />
                  ))}
                </div>
              ) : error && posts.length === 0 ? (
                <div
                  role="alert"
                  className="flex min-w-0 flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-3.5 py-3.5 dark:border-destructive/30 dark:bg-destructive/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground dark:bg-muted/40">
                      <AlertCircle className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h2 className="text-sm font-semibold text-foreground">
                        読み込みに失敗しました
                      </h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {error}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void refresh();
                    }}
                    className="h-9 self-start rounded-full px-3"
                  >
                    もう一度お試しください
                  </Button>
                </div>
              ) : (
                <>
                  {error && posts.length > 0 ? (
                    <div
                      role="alert"
                      className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-3 py-2 text-xs dark:border-destructive/30 dark:bg-destructive/10"
                    >
                      <AlertCircle
                        className="size-4 shrink-0 text-destructive/70"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-muted-foreground">
                        最新の読み込みに失敗しました。表示中の投稿は引き続き閲覧できます。
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void refresh();
                        }}
                        className="h-8 rounded-full px-2.5 text-[11px]"
                      >
                        再試行
                      </Button>
                    </div>
                  ) : null}

                  {showEmptyFeed ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-6 text-center sm:py-8">
                      <div className={emptyStateIconClassName}>
                        <Ear className="size-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-base font-semibold text-foreground">
                          まだ公開された実況表現はありません
                        </h2>
                        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                          公開されると、ここにみんなの実況表現が表示されます。
                        </p>
                      </div>
                    </div>
                  ) : showSearchEmpty ? (
                    <div
                      role="status"
                      className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-5 text-center"
                    >
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-foreground">
                          条件に一致する表現がありません
                        </h2>
                        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
                          {categoryFilter !== "all" && normalizedQuery
                            ? "検索キーワードまたはカテゴリを変えてみてください。"
                            : categoryFilter !== "all"
                              ? "カテゴリを変えるか、「すべて」に戻してみてください。"
                              : "検索キーワードを変えてみてください。"}
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery("");
                            setCategoryFilter("all");
                          }}
                          className="h-8 rounded-full px-3 text-xs"
                        >
                          条件をクリア
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPosts.map((post) => {
                        const owned = isOwnedDiscoverPost(
                          post.id,
                          myPublishedPostIds
                        );
                        return (
                          <DiscoverFeedCard
                            key={post.id}
                            post={post}
                            isHeard={isHeard(post.id)}
                            isHeardUpdating={isUpdating(post.id)}
                            onToggleHeard={onToggleHeard}
                            isVocabularySaved={isVocabularySaved(post)}
                            isVocabularyUpdating={isVocabularyUpdating(post.id)}
                            isAuthenticated={isAuthenticated}
                            onAddToVocabulary={onAddToVocabulary}
                            isOwnedByViewer={owned}
                            isUnpublishPending={
                              owned && isUnpublishPending(post.englishText)
                            }
                            onUnpublish={owned ? handleUnpublish : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </FadeIn>
          </div>

          <DiscoverAside
            trendingItems={trendingItems}
            mostHeardItems={mostHeardItems}
          />
        </div>
      </main>

      <Dialog.Root open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl outline-none">
              <Dialog.Title className="text-base font-semibold text-foreground">
                ログインが必要です
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                「聞いたことある」を付けるにはGoogleログインが必要です。人数の閲覧はそのまま利用できます。
              </Dialog.Description>
              <div className="mt-5 space-y-3">
                <LoginButton returnTo="/discover" fullWidth />
                <Dialog.Close
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full"
                  )}
                >
                  閉じる
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
