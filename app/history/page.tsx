"use client";

import { History, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { CommentaryHistory } from "@/components/commentary/commentary-history";
import {
  FrequentExpressions,
  HistoryStats,
  LearningTip,
  type FrequentExpression,
} from "@/components/history/history-sidebar";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { useAuth } from "@/hooks/use-auth";
import {
  removeHistory,
  useCommentaryHistory,
} from "@/hooks/use-commentary-history";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
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

  const header = (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          履歴
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          これまでに作成した英語実況の履歴です
        </p>
        {hasHistory ? (
          <p className="text-xs text-muted-foreground/70">
            履歴 {history.length}件　·　最新の変換が先頭
          </p>
        ) : null}
      </div>

      {hasHistory ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-9 shrink-0 gap-1.5 self-start rounded-full px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          履歴をすべて削除
        </Button>
      ) : null}
    </header>
  );

  if (!hasHistory) {
    return (
      <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 overflow-x-hidden px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
          <FadeIn>{header}</FadeIn>
          <FadeIn>
            <div className="flex flex-col items-center gap-3 py-12 text-center sm:py-16">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <History className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  変換履歴はまだありません
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Homeで英語実況を作成すると、ここから過去の結果を確認できます
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-1 rounded-full px-5"
              >
                Homeで英語実況を作る
              </Button>
            </div>
          </FadeIn>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-5">
            <FadeIn>{header}</FadeIn>

            <FadeIn className="flex flex-col gap-3">
              <div
                role="group"
                aria-label="期間で絞り込み"
                className="flex flex-wrap gap-2"
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
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-1",
                        active
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-xs dark:border-emerald-500 dark:bg-emerald-600"
                          : "border-border/70 bg-background text-muted-foreground hover:border-emerald-300 hover:text-emerald-800 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <label htmlFor={searchInputId} className="sr-only">
                  履歴を検索
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="text"
                  inputMode="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="日本語や英語で検索..."
                  className="h-10 w-full rounded-full border border-border/70 bg-background pr-4 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:bg-input/30"
                />
              </div>
            </FadeIn>

            {filteredHistory.length > 0 ? (
              <CommentaryHistory
                items={filteredHistory}
                onSelect={handleHistorySelect}
                onDelete={handleDelete}
              />
            ) : (
              <FadeIn>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 py-10 text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground dark:bg-muted/40">
                    <Search className="size-4" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">
                      一致する履歴がありません
                    </h2>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                      検索条件や期間を変更してみてください
                    </p>
                  </div>
                  {isFiltering ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-1 h-9 rounded-full px-4"
                    >
                      フィルターを解除
                    </Button>
                  ) : null}
                </div>
              </FadeIn>
            )}

            {/* Mobile-only learning record (right-column elements move below list) */}
            <HistoryStats
              conversions={stats.conversions}
              expressions={stats.expressions}
              favorites={stats.favorites}
              studyDays={stats.studyDays}
              className="lg:hidden"
            />
          </div>

          {/* Right column (Desktop only) */}
          <aside
            aria-label="学習の記録"
            className="hidden min-w-0 flex-col gap-4 lg:flex"
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
