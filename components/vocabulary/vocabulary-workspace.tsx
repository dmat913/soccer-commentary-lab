"use client";

import {
  ArrowLeft,
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
import { microLabelClassName } from "@/lib/design/surfaces";
import {
  vocabularyStatusBadgeClassName,
  vocabularyStatusDotClassName,
} from "@/lib/design/vocabulary-status";
import { VOCABULARY_MASTERY_STREAK } from "@/lib/vocabulary/learning";
import {
  filterVocabularyItems,
  formatVocabularyReviewedAt,
  formatVocabularyReviewRecency,
  getVocabularyReviewRecommendations,
  summarizeVocabularyLearning,
  sortVocabularyItems,
  vocabularyFilterEmptyCopy,
  vocabularyMasteryPercent,
  vocabularyMasteryRemainingLabel,
  vocabularyStatusFilterLabel,
  vocabularyStatusLabel,
  vocabularyStreakProgressLabel,
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
  return item.japaneseText.trim();
}

function vocabularyProgressFillClassName(
  status: VocabularyLearningStatus
): string {
  switch (status) {
    case "new":
      return "bg-sky-500";
    case "learning":
      return "bg-amber-500";
    case "mastered":
      return "bg-emerald-600";
  }
}

function vocabularyProgressTrackClassName(
  status: VocabularyLearningStatus
): string {
  switch (status) {
    case "new":
      return "bg-sky-500/20";
    case "learning":
      return "bg-amber-500/20";
    case "mastered":
      return "bg-emerald-600/20";
  }
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
        "inline-flex max-w-full shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors duration-300 ease-out motion-reduce:transition-none",
        vocabularyStatusBadgeClassName(status, selected)
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
  const masteryPercent = vocabularyMasteryPercent(summary);
  const stats = [
    { label: "NEW", value: summary.newCount, status: "new" as const },
    {
      label: "学習中",
      value: summary.learningCount,
      status: "learning" as const,
    },
    {
      label: "習得済み",
      value: summary.masteredCount,
      status: "mastered" as const,
    },
  ] as const;

  return (
    <section
      aria-label="学習ダッシュボード"
      className={cn(
        "rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 shadow-none",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
          {summary.total}
        </p>
        <p className="text-[11px] text-muted-foreground">表現</p>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            Progress
          </p>
          <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
            {masteryPercent}%
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={masteryPercent}
          aria-label={`習得率 ${masteryPercent}%（習得済み ${summary.masteredCount} / 総数 ${summary.total}）`}
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
      </div>

      <dl
        className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2"
        role="list"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            role="listitem"
            className="min-w-0 rounded-lg bg-muted/40 px-1.5 py-1.5 text-center sm:px-2"
          >
            <dt className="flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  vocabularyStatusDotClassName(stat.status)
                )}
                aria-hidden="true"
              />
              <span className="truncate">{stat.label}</span>
            </dt>
            <dd className="mt-0.5 text-base font-semibold tracking-tight text-foreground tabular-nums sm:text-lg">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
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
        "rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 shadow-none",
        className
      )}
    >
      <div className="space-y-0.5">
        <h2
          id={headingId}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          今日の復習
        </h2>
        <p className="text-[11px] leading-snug text-muted-foreground">
          いま選んで練習すると学習が進みます
        </p>
      </div>

      <ul
        id={listId}
        aria-labelledby={headingId}
        className="mt-2 space-y-1"
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
                  "flex w-full min-h-10 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
                  isSelected
                    ? "border border-primary/30 bg-primary/[0.08] text-foreground"
                    : "border border-transparent hover:bg-muted/50"
                )}
              >
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block truncate text-[13px] font-medium tracking-tight text-foreground">
                    {primary}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    最終学習 · {recency}
                  </span>
                </span>
                <VocabularyStatusBadge status={item.status} />
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
  showDashboard = true,
  showReview = true,
}: {
  summary: VocabularyLearningSummary;
  reviewItems: readonly VocabularyItem[];
  selectedId: string | null;
  onSelectReview: (id: string) => void;
  className?: string;
  showDashboard?: boolean;
  showReview?: boolean;
}) {
  const reviewVisible = showReview && reviewItems.length > 0;
  const dashboardVisible = showDashboard && summary.total > 0;

  if (!reviewVisible && !dashboardVisible) {
    return null;
  }

  return (
    <aside
      aria-label="学習の補助情報"
      className={cn("flex min-w-0 flex-col gap-2.5", className)}
    >
      {reviewVisible ? (
        <VocabularyTodayReview
          items={reviewItems}
          selectedId={selectedId}
          onSelect={onSelectReview}
        />
      ) : null}
      {dashboardVisible ? (
        <VocabularyLearningDashboard summary={summary} />
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
  const streakLabel = vocabularyStreakProgressLabel(item.correctStreak);
  const masteryHint = vocabularyMasteryRemainingLabel(item.correctStreak);
  const reviewedLabel = formatVocabularyReviewedAt(item.lastReviewedAt);
  const streakFilled = Math.min(
    Math.max(item.correctStreak, 0),
    VOCABULARY_MASTERY_STREAK
  );
  const progressFill = vocabularyProgressFillClassName(item.status);
  const progressTrack = vocabularyProgressTrackClassName(item.status);
  const isMastered = item.status === "mastered";

  async function handleCopy() {
    const ok = await copyText(item.englishText);
    if (!ok) {
      toast.error("コピーに失敗しました");
      return;
    }
    toast.success("コピーしました");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      <section className="min-w-0" aria-labelledby="vocab-detail-english">
        <div className="relative min-w-0 pr-[7.25rem]">
          <h2
            id="vocab-detail-english"
            className="text-xl font-semibold tracking-tight text-balance break-words text-foreground sm:text-2xl sm:leading-snug"
          >
            {item.englishText}
          </h2>
          <div className="absolute top-0 right-0 flex shrink-0 items-center gap-0.5">
            <SpeechPlaybackButton
              text={item.englishText}
              variant="icon"
              className="size-9 min-h-9 min-w-9 rounded-full text-foreground/65 hover:bg-muted hover:text-foreground [&_svg]:size-4"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleCopy()}
              aria-label={copied ? "コピーしました" : "英語をコピー"}
              className="size-9 min-h-9 min-w-9 rounded-full text-foreground/65 hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Clipboard className="size-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="単語帳から削除"
              className="size-9 min-h-9 min-w-9 rounded-full text-foreground/55 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {item.japaneseText.trim() ? (
          <p className="mt-1.5 break-words text-xs leading-snug text-muted-foreground sm:text-sm">
            <span className="font-medium text-muted-foreground/80">
              元の日本語
            </span>
            <span aria-hidden="true"> · </span>
            {item.japaneseText}
          </p>
        ) : null}
      </section>

      {item.meaning.trim() ? (
        <section
          className="space-y-0.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 dark:border-border/60 dark:bg-muted/30"
          aria-labelledby="vocab-detail-meaning"
        >
          <h3
            id="vocab-detail-meaning"
            className={cn(microLabelClassName, "text-slate-500 dark:text-muted-foreground")}
          >
            Meaning
          </h3>
          <p className="break-words text-sm leading-snug text-slate-700 dark:text-foreground">
            {item.meaning}
          </p>
        </section>
      ) : null}

      {hasLearningPoint && item.learningPoint ? (
        <section
          className={cn(
            "rounded-lg border border-primary/20 bg-primary/[0.04] p-2.5",
            item.learningPoint.meaning.trim() ? "space-y-1" : "space-y-0.5"
          )}
          aria-labelledby="vocab-detail-learning-point"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/[0.08] px-1.5 py-px text-[10px] font-semibold tracking-wide text-primary uppercase">
              <Lightbulb className="size-2.5" aria-hidden="true" />
              Learning Point
            </span>
          </div>
          <h3
            id="vocab-detail-learning-point"
            className="text-sm font-semibold leading-snug tracking-wide break-words text-foreground sm:text-base"
          >
            {item.learningPoint.text}
          </h3>
          {item.learningPoint.meaning.trim() ? (
            <p className="break-words text-xs leading-snug text-muted-foreground">
              {item.learningPoint.meaning}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-3"
        aria-labelledby="vocab-detail-learning-status"
      >
        <h3
          id="vocab-detail-learning-status"
          className={microLabelClassName}
        >
          Progress
        </h3>

        {isMastered ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition-colors duration-300 ease-out motion-reduce:transition-none dark:text-emerald-300">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            習得済み
          </p>
        ) : (
          <div className="space-y-1.5">
            <div
              className="flex gap-1"
              role="img"
              aria-label={`連続正解の進捗 ${streakLabel}。${masteryHint}`}
            >
              {Array.from(
                { length: VOCABULARY_MASTERY_STREAK },
                (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none",
                      index < streakFilled ? progressFill : progressTrack
                    )}
                    aria-hidden="true"
                  />
                )
              )}
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {streakLabel}
            </p>
            <p className="text-[11px] text-muted-foreground transition-opacity duration-300 ease-out motion-reduce:transition-none">
              {masteryHint}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="text-xs text-muted-foreground">最終学習</span>
          <span className="font-medium text-foreground">{reviewedLabel}</span>
        </div>

        {isMastered ? (
          <div className="space-y-1.5 border-t border-border/50 pt-2.5">
            <p className="text-[11px] leading-snug text-muted-foreground">
              習得済みを取り消して、もう一度学習対象に戻します。
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onMarkStillLearning}
              aria-label="まだ覚えていないので学習中に戻す"
              className="h-9 w-full rounded-xl border-amber-300/80 bg-amber-50/50 text-amber-950 hover:bg-amber-100/70 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50"
            >
              <RotateCcw className="size-3.5 shrink-0" aria-hidden="true" />
              まだ覚えていない
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-1.5" aria-labelledby="vocab-detail-practice">
        <h3 id="vocab-detail-practice" className={microLabelClassName}>
          この表現を練習
        </h3>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Quiz・Dailyの結果が学習状況に反映されます
        </p>
        <div className="flex flex-col gap-1.5">
          <Button
            size="lg"
            className="h-10 w-full rounded-xl"
            nativeButton={false}
            render={<Link href="/quiz" />}
          >
            <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
            Quizに挑戦
          </Button>
          <Button
            variant="outline"
            className="h-9 w-full rounded-xl"
            nativeButton={false}
            render={<Link href="/daily" />}
          >
            今日のChallengeへ
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full max-w-full rounded-xl border border-border/60"
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
              className="size-3.5 shrink-0 fill-foreground/55 text-foreground/70"
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
    <div className="flex min-w-0 flex-col gap-2.5">
      {/* Mobile: 今日の復習 first. Tablet: review + compact dashboard above. */}
      <VocabularyLearningAids
        summary={learningSummary}
        reviewItems={reviewRecommendations}
        selectedId={activeSelectedId}
        onSelectReview={handleSelectReviewCandidate}
        showDashboard={false}
        className="md:hidden"
      />
      <VocabularyLearningAids
        summary={learningSummary}
        reviewItems={reviewRecommendations}
        selectedId={activeSelectedId}
        onSelectReview={handleSelectReviewCandidate}
        className="hidden md:flex xl:hidden"
      />

      <div
        ref={workspaceRef}
        className={cn(
          "grid min-w-0 grid-cols-1",
          "rounded-2xl border border-border/70 bg-card/70",
          "md:min-h-[26rem] md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:overflow-hidden",
          "xl:min-h-0 xl:grid-cols-[minmax(13rem,0.26fr)_minmax(22rem,1fr)_minmax(13rem,0.22fr)]",
          "xl:items-stretch xl:gap-3 xl:overflow-visible xl:rounded-none xl:border-0 xl:bg-transparent"
        )}
      >
        <aside
          className={cn(
            "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
            "border-border/70",
            "md:h-0 md:min-h-full md:border-r",
            "xl:rounded-xl xl:border xl:border-border/70 xl:bg-card/60",
            mobileShowDetail ? "hidden md:flex" : "flex"
          )}
          aria-label="語彙一覧"
        >
          <div className="shrink-0 space-y-2 border-b border-border/70 p-2.5 xl:p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-foreground">
                保存した表現
              </p>
              <p
                className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {resultCountLabel}
              </p>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
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
                className="flex h-9 w-full min-w-0 rounded-lg border border-border/70 bg-background py-1.5 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-input/30"
              />
            </div>

            <div>
              <p
                id={statusFilterId}
                className={cn(microLabelClassName, "mb-1")}
              >
                ステータス
              </p>
              <div
                role="radiogroup"
                aria-labelledby={statusFilterId}
                className="grid grid-cols-2 gap-1"
              >
                {VOCABULARY_STATUS_FILTERS.map((filter) => {
                  const selected = statusFilter === filter;
                  const statusDot =
                    filter === "all"
                      ? null
                      : vocabularyStatusDotClassName(filter);
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border px-1.5 py-1 text-center text-[11px] font-medium transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
                        selected
                          ? "border-primary/40 bg-primary/[0.08] text-foreground"
                          : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {statusDot ? (
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            statusDot
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                      {vocabularyStatusFilterLabel(filter)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor={sortSelectId}
                className={cn(microLabelClassName, "shrink-0")}
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
                aria-label="単語帳の並び替え"
                className="flex h-8 min-w-0 flex-1 rounded-md border border-border/60 bg-background px-2 text-xs text-muted-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-input/30"
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
            aria-label="単語帳一覧"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {filteredItems.length === 0 ? (
              <div
                role="status"
                className="flex flex-col items-center gap-1.5 px-3 py-5 text-center"
              >
                <p className="text-sm font-medium text-foreground">
                  {emptyCopy.title}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {emptyCopy.description}
                </p>
                {isSearching || isFiltering ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                    }}
                    className="mt-1 h-8 rounded-full px-3 text-xs"
                  >
                    条件をクリア
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-0.5 p-1.5">
                {filteredItems.map((item) => {
                  const isSelected = item.id === activeSelectedId;
                  const secondary = listSecondaryLabel(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item.id)}
                        className={cn(
                          "flex w-full min-h-11 items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
                          isSelected
                            ? "border-l-2 border-l-primary bg-primary/[0.08] pl-[calc(0.5rem-2px)] text-foreground"
                            : "border-l-2 border-l-transparent hover:bg-muted/50"
                        )}
                      >
                        <span className="min-w-0 flex-1 space-y-0.5">
                          <span className="line-clamp-2 block text-[13px] font-semibold leading-snug tracking-tight text-foreground">
                            {listPrimaryLabel(item)}
                          </span>
                          {secondary ? (
                            <span className="line-clamp-1 block text-[11px] text-muted-foreground">
                              {secondary}
                            </span>
                          ) : null}
                        </span>
                        <VocabularyStatusBadge status={item.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Phone: Dashboard after the list so search/list stay closer to the top. */}
          {learningSummary.total > 0 ? (
            <div className="shrink-0 border-t border-border/60 p-2.5 md:hidden">
              <VocabularyLearningDashboard summary={learningSummary} />
            </div>
          ) : null}
        </aside>

        <section
          className={cn(
            "min-h-0 min-w-0 flex-col p-3.5 pb-5 sm:p-4 md:pb-5",
            "xl:rounded-xl xl:border xl:border-border/70 xl:bg-card/80",
            mobileShowDetail ? "flex" : "hidden md:flex"
          )}
          aria-label="選択した表現の詳細"
        >
          <div className="mb-2 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="h-9 gap-1.5 rounded-full px-2.5 text-muted-foreground hover:text-foreground"
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
            <div
              role="status"
              className="flex flex-col items-center justify-center gap-2 px-3 py-8 text-center"
            >
              <p className="text-sm font-medium text-foreground">
                {isSearching || isFiltering
                  ? emptyCopy.title
                  : "表現を選択してください"}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {isSearching || isFiltering
                  ? emptyCopy.description
                  : "左の一覧から学習したい表現を選ぶと、ここに詳細が表示されます。"}
              </p>
            </div>
          )}
        </section>

        {/* Desktop right column: 今日の復習 first, then summary. */}
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
