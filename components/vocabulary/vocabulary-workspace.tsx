"use client";

import {
  ArrowLeft,
  BookMarked,
  Clipboard,
  Check,
  GraduationCap,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { Button } from "@/components/ui/button";
import { useVocabulary } from "@/hooks/use-vocabulary";
import { VOCABULARY_MASTERY_STREAK } from "@/lib/vocabulary/learning";
import {
  filterVocabularyItems,
  formatVocabularyReviewedAt,
  formatVocabularyReviewRecency,
  getVocabularyReviewRecommendations,
  vocabularyFilterEmptyCopy,
  vocabularyStatusFilterLabel,
  vocabularyStatusLabel,
  vocabularyStreakProgressLabel,
  summarizeVocabularyLearning,
  sortVocabularyItems,
  vocabularySortOptionLabel,
  isVocabularySortOption,
  VOCABULARY_SORT_OPTIONS,
  VOCABULARY_STATUS_FILTERS,
  type VocabularyLearningSummary,
  type VocabularyStatusFilter,
} from "@/lib/vocabulary/display";
import {
  getServerVocabularySortPreferenceSnapshot,
  getVocabularySortPreferenceSnapshot,
  setVocabularySortPreference,
  subscribeVocabularySortPreference,
} from "@/lib/vocabulary/sort-preference";
import { cn } from "@/lib/utils";
import type {
  VocabularyItem,
  VocabularyLearningStatus,
} from "@/types/vocabulary";

function getYouTubeSearchUrl(commentaryText: string): string {
  const query = `"${commentaryText}" Premier League commentary`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function listPrimaryLabel(item: VocabularyItem): string {
  const learningPoint = item.learningPoint?.text.trim();
  return learningPoint || item.englishText;
}

function listSecondaryLabel(item: VocabularyItem): string {
  const meaning = item.meaning.trim();
  if (meaning) {
    return meaning;
  }
  return item.englishText;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const didCopy = document.execCommand("copy");
    document.body.removeChild(textarea);
    return didCopy;
  } catch {
    return false;
  }
}

function statusBadgeClassName(
  status: VocabularyLearningStatus,
  selected: boolean
): string {
  switch (status) {
    case "new":
      return selected
        ? "border-emerald-300/90 bg-emerald-100 text-emerald-900 dark:border-emerald-600/70 dark:bg-emerald-900/55 dark:text-emerald-50"
        : "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/55 dark:bg-emerald-950/35 dark:text-emerald-200";
    case "learning":
      return selected
        ? "border-emerald-400/80 bg-emerald-100/90 text-emerald-900 dark:border-emerald-600/70 dark:bg-emerald-900/50 dark:text-emerald-50"
        : "border-emerald-300/80 bg-emerald-100/70 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/45 dark:text-emerald-100";
    case "mastered":
      return selected
        ? "border-emerald-500/70 bg-emerald-600/90 text-white dark:border-emerald-400/50 dark:bg-emerald-500/85 dark:text-emerald-950"
        : "border-emerald-400/70 bg-emerald-200/50 text-emerald-950 dark:border-emerald-600/70 dark:bg-emerald-900/50 dark:text-emerald-50";
  }
}

function VocabularyStatusBadge({
  status,
  selected = false,
}: {
  status: VocabularyLearningStatus;
  selected?: boolean;
}) {
  const label = vocabularyStatusLabel(status);
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        statusBadgeClassName(status, selected)
      )}
    >
      {label}
    </span>
  );
}

function VocabularyLearningDashboard({
  summary,
  className,
}: {
  summary: VocabularyLearningSummary;
  className?: string;
}) {
  const stats = [
    { label: "NEW", value: summary.newCount },
    { label: "学習中", value: summary.learningCount },
    { label: "習得済み", value: summary.masteredCount },
  ] as const;

  return (
    <section
      aria-label="学習ダッシュボード"
      className={cn(
        "rounded-2xl border border-emerald-100/80 bg-card/80 px-3.5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:px-4",
        className
      )}
    >
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
          Vocabulary
        </p>
        <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
          {summary.total}{" "}
          <span className="text-sm font-medium text-muted-foreground">
            Expressions
          </span>
        </p>
      </div>

      <div
        className="mt-3 border-t border-emerald-100/90 pt-3 dark:border-emerald-900/50"
        role="list"
      >
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label} role="listitem" className="min-w-0 space-y-0.5">
              <dt className="text-[11px] font-medium text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function VocabularyTodayReview({
  items,
  selectedId,
  onSelect,
  className,
}: {
  items: readonly VocabularyItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const headingId = useId();
  const listId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-2xl border border-emerald-100/70 bg-card/60 px-3.5 py-3.5 dark:border-emerald-900/45 dark:bg-emerald-950/15 sm:px-4",
        className
      )}
    >
      <div className="space-y-1">
        <h2
          id={headingId}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          今日の復習
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          学習中の表現と、まだ練習していない表現を優先しています。
        </p>
      </div>

      <ul
        id={listId}
        aria-labelledby={headingId}
        className="mt-2.5 divide-y divide-border/50"
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const primary = listPrimaryLabel(item);
          const recency = formatVocabularyReviewRecency(item.lastReviewedAt);
          const statusLabel = vocabularyStatusLabel(item.status);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isSelected ? "true" : undefined}
                aria-label={`${primary}、${statusLabel}、最終学習 ${recency}`}
                className={cn(
                  "flex w-full min-h-11 items-start justify-between gap-2 py-2.5 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
                  isSelected
                    ? "text-emerald-950 dark:text-emerald-50"
                    : "hover:text-foreground"
                )}
              >
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span
                    className={cn(
                      "block text-sm font-medium tracking-tight break-words",
                      isSelected
                        ? "text-emerald-950 dark:text-emerald-50"
                        : "text-foreground"
                    )}
                  >
                    {primary}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    最終学習 · {recency}
                  </span>
                </span>
                <VocabularyStatusBadge
                  status={item.status}
                  selected={isSelected}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function VocabularyLearningAids({
  summary,
  reviewItems,
  selectedId,
  onSelectReview,
  className,
}: {
  summary: VocabularyLearningSummary;
  reviewItems: readonly VocabularyItem[];
  selectedId: string | null;
  onSelectReview: (id: string) => void;
  className?: string;
}) {
  if (summary.total === 0 && reviewItems.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="学習の補助情報"
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      {summary.total > 0 ? (
        <VocabularyLearningDashboard summary={summary} />
      ) : null}
      {reviewItems.length > 0 ? (
        <VocabularyTodayReview
          items={reviewItems}
          selectedId={selectedId}
          onSelect={onSelectReview}
        />
      ) : null}
    </aside>
  );
}

type VocabularyDetailProps = {
  item: VocabularyItem;
  onRemove: () => void;
  onMarkStillLearning: () => void;
};

function VocabularyDetail({
  item,
  onRemove,
  onMarkStillLearning,
}: VocabularyDetailProps) {
  const [copied, setCopied] = useState(false);
  const hasLearningPoint = Boolean(item.learningPoint?.text?.trim());
  const youtubeSearchUrl = getYouTubeSearchUrl(item.englishText);
  const statusLabel = vocabularyStatusLabel(item.status);
  const streakLabel = vocabularyStreakProgressLabel(item.correctStreak);
  const reviewedLabel = formatVocabularyReviewedAt(item.lastReviewedAt);
  const streakFilled = Math.min(
    Math.max(item.correctStreak, 0),
    VOCABULARY_MASTERY_STREAK
  );

  async function handleCopy() {
    const ok = await copyText(item.englishText);
    if (!ok) {
      toast.error("コピーに失敗しました");
      return;
    }
    toast.success("Copied!");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-2" aria-labelledby="vocab-detail-english">
        <div className="flex items-start justify-between gap-2">
          <h2
            id="vocab-detail-english"
            className="pt-1 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
          >
            英語実況
          </h2>
          <div className="-mr-1 flex shrink-0 flex-wrap items-center justify-end gap-0.5">
            <SpeechPlaybackButton text={item.englishText} variant="icon" />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => void handleCopy()}
              aria-label={copied ? "コピーしました" : "英語をコピー"}
              className="size-11 min-h-11 min-w-11 rounded-full text-foreground/70 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-100"
            >
              {copied ? (
                <Check className="size-5 text-emerald-600" aria-hidden="true" />
              ) : (
                <Clipboard className="size-5" aria-hidden="true" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={onRemove}
              aria-label="単語帳から削除"
              className="size-11 min-h-11 min-w-11 rounded-full text-foreground/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-balance break-words text-foreground sm:text-3xl sm:leading-tight">
          {item.englishText}
        </p>
      </section>

      {item.japaneseText.trim() ? (
        <section
          className="space-y-1.5 border-l-2 border-emerald-200/80 pl-3 dark:border-emerald-800/60"
          aria-labelledby="vocab-detail-japanese"
        >
          <h2
            id="vocab-detail-japanese"
            className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
          >
            元の日本語
          </h2>
          <p className="break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
            {item.japaneseText}
          </p>
        </section>
      ) : null}

      {item.meaning.trim() ? (
        <section
          className="space-y-1 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
          aria-labelledby="vocab-detail-meaning"
        >
          <h2
            id="vocab-detail-meaning"
            className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
          >
            Meaning
          </h2>
          <p className="break-words text-sm leading-relaxed text-foreground sm:text-base">
            {item.meaning}
          </p>
        </section>
      ) : null}

      {hasLearningPoint && item.learningPoint ? (
        <section
          className="space-y-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-800/45 dark:bg-emerald-950/25"
          aria-labelledby="vocab-detail-learning-point"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-emerald-500/90 dark:text-emerald-950">
              <Lightbulb className="size-3" aria-hidden="true" />
              Learning Point
            </span>
          </div>
          <h2
            id="vocab-detail-learning-point"
            className="text-lg font-semibold tracking-wide break-words text-emerald-950 dark:text-emerald-50 sm:text-xl"
          >
            {item.learningPoint.text}
          </h2>
          {item.learningPoint.meaning.trim() ? (
            <p className="break-words text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
              {item.learningPoint.meaning}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className="space-y-3 rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"
        aria-labelledby="vocab-detail-learning-status"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="vocab-detail-learning-status"
            className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
          >
            学習状況
          </h2>
          <VocabularyStatusBadge status={item.status} />
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">ステータス</dt>
            <dd className="font-medium text-foreground">{statusLabel}</dd>
          </div>
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <dt className="text-xs text-muted-foreground">連続正解</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {streakLabel}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  （{VOCABULARY_MASTERY_STREAK}連続正解で習得）
                </span>
              </dd>
            </div>
            <div
              className="flex gap-1.5"
              role="img"
              aria-label={`連続正解の進捗 ${streakLabel}`}
            >
              {Array.from({ length: VOCABULARY_MASTERY_STREAK }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    index < streakFilled
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-emerald-100 dark:bg-emerald-950/80"
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">最終学習</dt>
            <dd className="font-medium text-foreground">{reviewedLabel}</dd>
          </div>
        </dl>

        {item.status === "mastered" ? (
          <div className="space-y-2 border-t border-emerald-100/90 pt-3 dark:border-emerald-900/50">
            <p className="text-xs leading-relaxed text-muted-foreground">
              習得済み判定を取り消して、もう一度学習対象に戻します。
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onMarkStillLearning}
              aria-label="まだ覚えていないので学習中に戻す"
              className="h-11 w-full rounded-xl border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-emerald-800 dark:bg-background dark:text-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              まだ覚えていない
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-2 pt-1" aria-labelledby="vocab-detail-practice">
        <h2
          id="vocab-detail-practice"
          className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
        >
          Practice
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          QuizやDaily Challengeで練習すると、学習状況へ結果が反映されます。
        </p>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            nativeButton={false}
            render={<Link href="/quiz" />}
          >
            <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
            Quizへ
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl"
            nativeButton={false}
            render={<Link href="/daily" />}
          >
            Daily Challengeへ
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full max-w-full rounded-xl border-border bg-white hover:border-emerald-300/70 hover:bg-emerald-50/40 dark:bg-background dark:hover:border-emerald-700/60 dark:hover:bg-emerald-950/30"
            nativeButton={false}
            render={
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="この表現をYouTubeの実況で練習する"
              />
            }
          >
            <Play
              className="size-4 shrink-0 fill-red-600 text-red-600"
              aria-hidden="true"
            />
            <span className="truncate">この表現を練習</span>
          </Button>
        </div>
      </section>
    </div>
  );
}

export function VocabularyWorkspace() {
  const {
    vocabularyItems,
    removeVocabularyItem,
    markVocabularyStillLearning,
  } = useVocabulary();
  const searchInputId = useId();
  const listboxId = useId();
  const statusFilterId = useId();
  const sortSelectId = useId();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VocabularyStatusFilter>("all");
  const sortOption = useSyncExternalStore(
    subscribeVocabularySortPreference,
    getVocabularySortPreferenceSnapshot,
    getServerVocabularySortPreferenceSnapshot
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const filteredItems = useMemo(() => {
    const filtered = filterVocabularyItems(
      vocabularyItems,
      query,
      statusFilter
    );
    return sortVocabularyItems(filtered, sortOption);
  }, [vocabularyItems, query, statusFilter, sortOption]);

  const learningSummary = useMemo(
    () => summarizeVocabularyLearning(vocabularyItems),
    [vocabularyItems]
  );

  const reviewRecommendations = useMemo(
    () => getVocabularyReviewRecommendations(vocabularyItems),
    [vocabularyItems]
  );

  // Prefer an explicit selection that still exists in the snapshot so review
  // candidates remain openable even when search/filter hide them from the list.
  const activeSelectedId = useMemo(() => {
    if (
      selectedId &&
      vocabularyItems.some((item) => item.id === selectedId)
    ) {
      return selectedId;
    }
    if (filteredItems.length === 0) {
      return null;
    }
    return filteredItems[0].id;
  }, [filteredItems, selectedId, vocabularyItems]);

  const selectedItem =
    vocabularyItems.find((item) => item.id === activeSelectedId) ?? null;
  const isSearching = query.trim().length > 0;
  const isFiltering = statusFilter !== "all";
  const resultCountLabel =
    isSearching || isFiltering
      ? `${filteredItems.length} / ${vocabularyItems.length}件`
      : `${vocabularyItems.length}件`;
  const emptyCopy = vocabularyFilterEmptyCopy({
    hasQuery: isSearching,
    statusFilter,
  });

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileShowDetail(true);
  }

  function handleSelectReviewCandidate(id: string) {
    const item = vocabularyItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    // Status filter can hide the candidate from the list; widen to「すべて」
    // so desktop list selection stays in sync. Keep the search query intact.
    if (statusFilter !== "all" && item.status !== statusFilter) {
      setStatusFilter("all");
    }
    setSelectedId(id);
    setMobileShowDetail(true);
    workspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function handleRemove(id: string) {
    const index = filteredItems.findIndex((item) => item.id === id);
    const nextItem =
      filteredItems[index + 1] ?? filteredItems[index - 1] ?? null;

    removeVocabularyItem(id);

    if (activeSelectedId === id) {
      setSelectedId(nextItem?.id ?? null);
      if (!nextItem) {
        setMobileShowDetail(false);
      }
    }
  }

  function handleMarkStillLearning(id: string) {
    markVocabularyStillLearning(id);
  }

  function handleBackToList() {
    setMobileShowDetail(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* Mobile / tablet: aids above the workspace (hidden on xl 3-column). */}
      <VocabularyLearningAids
        summary={learningSummary}
        reviewItems={reviewRecommendations}
        selectedId={activeSelectedId}
        onSelectReview={handleSelectReviewCandidate}
        className="xl:hidden"
      />

      <div
        ref={workspaceRef}
        className={cn(
          "grid min-w-0 grid-cols-1",
          "rounded-2xl border border-emerald-100/80 bg-card/80",
          "dark:border-emerald-900/50 dark:bg-emerald-950/20",
          // md–lg: 2-column list + detail card.
          "md:min-h-[26rem] md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:overflow-hidden",
          // xl+: 3-column — row height follows the center detail; columns stretch.
          "xl:min-h-0 xl:grid-cols-[minmax(14rem,0.28fr)_minmax(20rem,1fr)_minmax(14rem,0.24fr)]",
          "xl:items-stretch xl:gap-4 xl:overflow-visible xl:rounded-none xl:border-0 xl:bg-transparent",
          "dark:xl:bg-transparent"
        )}
      >
        <aside
          className={cn(
            "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
            "border-emerald-100/80 dark:border-emerald-900/50",
            // Match the grid row height (set by center detail), then scroll the list.
            "md:h-0 md:min-h-full md:border-r",
            "xl:rounded-2xl xl:border xl:border-emerald-100/80 xl:bg-card/80",
            "dark:xl:border-emerald-900/50 dark:xl:bg-emerald-950/20",
            mobileShowDetail ? "hidden md:flex" : "flex"
          )}
          aria-label="語彙一覧"
        >
          <div className="shrink-0 space-y-2.5 border-b border-emerald-100/80 p-3 dark:border-emerald-900/50 xl:space-y-2 xl:p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">保存した表現</p>
              <p
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {resultCountLabel}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground xl:hidden">
              一覧から選んで詳細を確認できます
            </p>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground xl:size-3.5"
                aria-hidden="true"
              />
              <input
                id={searchInputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="英語・意味・日本語で検索"
                aria-label="単語帳を検索"
                aria-controls={listboxId}
                className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-transparent py-1.5 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 xl:h-9 dark:bg-input/30"
              />
            </div>

            <div>
              <p
                id={statusFilterId}
                className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
              >
                ステータス
              </p>
              <div
                role="radiogroup"
                aria-labelledby={statusFilterId}
                className="grid grid-cols-2 gap-1.5"
              >
                {VOCABULARY_STATUS_FILTERS.map((filter) => {
                  const selected = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "min-h-10 rounded-lg border px-2 py-1.5 text-center text-xs font-medium transition-colors xl:min-h-9",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
                        selected
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-50"
                          : "border-border/70 bg-background/60 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {vocabularyStatusFilterLabel(filter)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor={sortSelectId}
                className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase"
              >
                並び替え
              </label>
              <select
                id={sortSelectId}
                value={sortOption}
                onChange={(event) => {
                  const next = event.target.value;
                  if (!isVocabularySortOption(next)) {
                    return;
                  }
                  setVocabularySortPreference(next);
                }}
                aria-label="Vocabularyの並び替え"
                className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 xl:h-9 dark:bg-input/30"
              >
                {VOCABULARY_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {vocabularySortOptionLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-label="Vocabulary一覧"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BookMarked
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-foreground">
                  {emptyCopy.title}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {emptyCopy.description}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60 p-1.5">
                {filteredItems.map((item) => {
                  const isSelected = item.id === activeSelectedId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item.id)}
                        className={cn(
                          "flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-colors xl:gap-0.5 xl:py-2",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
                          isSelected
                            ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-800/70"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <span className="flex min-w-0 items-start justify-between gap-2">
                          <span
                            className={cn(
                              "line-clamp-2 min-w-0 flex-1 text-sm font-semibold tracking-tight",
                              isSelected
                                ? "text-emerald-950 dark:text-emerald-50"
                                : "text-foreground"
                            )}
                          >
                            {listPrimaryLabel(item)}
                          </span>
                          <VocabularyStatusBadge
                            status={item.status}
                            selected={isSelected}
                          />
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {listSecondaryLabel(item)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section
          className={cn(
            "min-w-0 min-h-0 flex-col p-4 pb-6 sm:p-5",
            // xl: own card; natural page flow (no internal scroll). Sizes the grid row.
            "xl:rounded-2xl xl:border xl:border-emerald-100/80 xl:bg-card/80",
            "dark:xl:border-emerald-900/50 dark:xl:bg-emerald-950/20",
            mobileShowDetail ? "flex" : "hidden md:flex"
          )}
          aria-label="選択した表現の詳細"
        >
          <div className="mb-3 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              一覧へ戻る
            </Button>
          </div>

          {selectedItem ? (
            <VocabularyDetail
              item={selectedItem}
              onRemove={() => handleRemove(selectedItem.id)}
              onMarkStillLearning={() =>
                handleMarkStillLearning(selectedItem.id)
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BookMarked
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">
                {vocabularyItems.length === 0
                  ? "詳細を表示する表現がありません"
                  : emptyCopy.title}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {vocabularyItems.length === 0
                  ? "左の一覧から学習したい表現を選ぶと、ここに詳細が表示されます。"
                  : emptyCopy.description}
              </p>
            </div>
          )}
        </section>

        {/* xl desktop: learning aids as the right column (not shown on mobile detail). */}
        <VocabularyLearningAids
          summary={learningSummary}
          reviewItems={reviewRecommendations}
          selectedId={activeSelectedId}
          onSelectReview={handleSelectReviewCandidate}
          className="hidden h-full min-h-0 xl:flex"
        />
      </div>
    </div>
  );
}
