"use client";

import { History, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { CommentaryHistory } from "@/components/commentary/commentary-history";
import { HistoryListSkeleton } from "@/components/commentary/history-list-skeleton";
import {
  FrequentExpressions,
  HistoryStats,
  LearningTip,
  type FrequentExpression,
} from "@/components/history/history-sidebar";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { useAuth } from "@/hooks/use-auth";
import {
  removeHistory,
  useCommentaryHistory,
  useCommentaryHistoryLoading,
} from "@/hooks/use-commentary-history";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
import {
  emptyStateIconClassName,
  pageHeaderClassName,
  pageMainWideClassName,
  pageShellClassName,
  pageSubtitleClassName,
  pageTitleClassName,
  pillActiveClassName,
  pillBaseClassName,
  pillIdleClassName,
  searchInputClassName,
} from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";
import type { CommentaryHistoryItem } from "@/types/history";

const PERIOD_OPTIONS = [
  { id: "all", label: "すべて" },
  { id: "today", label: "今日" },
  { id: "7d", label: "7日間" },
  { id: "30d", label: "30日間" },
] as const;

type PeriodId = (typeof PERIOD_OPTIONS)[number]["id"];

const DAY_MS = 24 * 60 * 60 * 1000;

function isWithinPeriod(savedAt: string, period: PeriodId): boolean {
  if (period === "all") {
    return true;
  }

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  if (period === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const days = period === "7d" ? 7 : 30;
  return date.getTime() >= now.getTime() - days * DAY_MS;
}

function countStudyDays(history: CommentaryHistoryItem[]): number {
  const days = new Set<string>();
  for (const item of history) {
    const date = new Date(item.savedAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    days.add(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    );
  }
  return days.size;
}

function computeFrequentExpressions(
  history: CommentaryHistoryItem[]
): FrequentExpression[] {
  const counts = new Map<string, { count: number; order: number }>();
  let order = 0;
  for (const item of history) {
    for (const translation of item.translations) {
      const text = translation.text.trim();
      if (!text) {
        continue;
      }
      const existing = counts.get(text);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(text, { count: 1, order: order++ });
      }
    }
  }

  return Array.from(counts.entries())
    .map(([text, meta]) => ({ text, count: meta.count, order: meta.order }))
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 3)
    .map(({ text, count }) => ({ text, count }));
}

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const history = useCommentaryHistory();
  const isHistoryLoading = useCommentaryHistoryLoading();
  const favorites = useFavoriteTranslations();
  const searchInputId = useId();

  const [period, setPeriod] = useState<PeriodId>("all");
  const [query, setQuery] = useState("");

  const hasHistory = history.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (!isWithinPeriod(item.savedAt, period)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      if (item.japaneseText.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return item.translations.some((translation) =>
        translation.text.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [history, period, normalizedQuery]);

  const stats = useMemo(
    () => ({
      conversions: history.length,
      expressions: history.reduce(
        (total, item) => total + item.translations.length,
        0
      ),
      favorites: favorites.length,
      studyDays: countStudyDays(history),
    }),
    [history, favorites.length]
  );

  const frequentExpressions = useMemo(
    () => computeFrequentExpressions(history),
    [history]
  );

  const isFiltering = period !== "all" || normalizedQuery.length > 0;

  function handleHistorySelect(item: CommentaryHistoryItem) {
    router.push(`/?restore=${item.id}`);
  }

  function handleDelete(id: string) {
    removeHistory(id, user?.id);
  }

  function handleClearAll() {
    for (const item of history) {
      removeHistory(item.id, user?.id);
    }
  }

  function handleResetFilters() {
    setPeriod("all");
    setQuery("");
  }

  const clearAllButton = hasHistory ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClearAll}
      aria-label="履歴をすべて削除"
      className="h-8 shrink-0 gap-1.5 self-start rounded-full px-2.5 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      履歴をすべて削除
    </Button>
  ) : null;

  const header = (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className={cn(pageHeaderClassName, "space-y-1")}>
        <h1 className={pageTitleClassName}>履歴</h1>
        <p className={cn(pageSubtitleClassName, "text-[13px] sm:text-sm")}>
          これまでに変換した英語実況を振り返れます
        </p>
        {hasHistory ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {history.length}件の履歴
          </p>
        ) : null}
      </div>
      <div className="hidden sm:block">{clearAllButton}</div>
    </header>
  );

  if (!hasHistory) {
    if (isHistoryLoading) {
      return (
        <div className={pageShellClassName}>
          <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 md:py-10">
            <FadeIn>{header}</FadeIn>
            <HistoryListSkeleton />
          </main>
        </div>
      );
    }

    return (
      <div className={pageShellClassName}>
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 md:py-10">
          <FadeIn>{header}</FadeIn>
          <FadeIn>
            <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
              <div className={emptyStateIconClassName}>
                <History className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  履歴はまだありません
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  変換した実況が、ここに保存されます
                </p>
              </div>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-1 rounded-full px-5"
              >
                実況を作る
              </Button>
            </div>
          </FadeIn>
        </main>
      </div>
    );
  }

  return (
    <div className={pageShellClassName}>
      <main
        className={cn(
          pageMainWideClassName,
          "min-w-0 gap-4 sm:gap-5"
        )}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-2.5 sm:gap-3">
            <FadeIn>{header}</FadeIn>

            <FadeIn className="flex flex-col gap-2">
              <div className="relative max-w-xl">
                <label htmlFor={searchInputId} className="sr-only">
                  履歴を検索
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
                  placeholder="日本語や英語で検索…"
                  className={cn(
                    searchInputClassName,
                    "h-9 rounded-xl border-border/70 bg-background pl-9 shadow-none"
                  )}
                />
              </div>

              <div
                role="group"
                aria-label="期間で絞り込み"
                className="flex w-full max-w-xl gap-0.5 rounded-full border border-border/70 bg-background p-0.5"
              >
                {PERIOD_OPTIONS.map((option) => {
                  const active = period === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPeriod(option.id)}
                      className={cn(
                        pillBaseClassName,
                        "min-h-8 flex-1 rounded-full border-transparent px-2 py-1.5 text-[11px] sm:flex-none sm:px-3 sm:text-xs",
                        active ? pillActiveClassName : pillIdleClassName,
                        !active && "border-transparent bg-transparent"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="sm:hidden">{clearAllButton}</div>
            </FadeIn>

            {filteredHistory.length > 0 ? (
              <CommentaryHistory
                items={filteredHistory}
                onSelect={handleHistorySelect}
                onDelete={handleDelete}
              />
            ) : (
              <FadeIn>
                <div
                  role="status"
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-5 text-center"
                >
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">
                      条件に一致する履歴がありません
                    </h2>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
                      検索キーワードや期間を変えてみてください
                    </p>
                  </div>
                  {isFiltering ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-0.5 h-8 rounded-full px-3 text-xs"
                    >
                      フィルターを解除
                    </Button>
                  ) : null}
                </div>
              </FadeIn>
            )}

            <div className="flex flex-col gap-2.5 lg:hidden">
              <HistoryStats
                conversions={stats.conversions}
                expressions={stats.expressions}
                favorites={stats.favorites}
                studyDays={stats.studyDays}
              />
              <FrequentExpressions expressions={frequentExpressions} />
              <LearningTip />
            </div>
          </div>

          <aside
            aria-label="学習の記録"
            className="hidden min-w-0 flex-col gap-2.5 lg:flex"
          >
            <HistoryStats
              conversions={stats.conversions}
              expressions={stats.expressions}
              favorites={stats.favorites}
              studyDays={stats.studyDays}
            />
            <FrequentExpressions expressions={frequentExpressions} />
            <LearningTip />
          </aside>
        </div>
      </main>
    </div>
  );
}
