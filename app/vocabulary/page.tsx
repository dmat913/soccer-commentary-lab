"use client";

import { BookMarked, Check, GraduationCap, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { VocabularyWorkspace } from "@/components/vocabulary/vocabulary-workspace";
import { VocabularyWorkspaceSkeleton } from "@/components/vocabulary/vocabulary-workspace-skeleton";
import { useDailyChallenge } from "@/hooks/use-daily-challenge";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  emptyStateIconClassName,
  pageHeaderClassName,
  pageMainClassName,
  pageMainWideClassName,
  pageShellClassName,
  pageSubtitleClassName,
  pageTitleClassName,
} from "@/lib/design/surfaces";
import {
  QUIZ_MAX_QUESTIONS,
  QUIZ_MIN_ITEMS,
} from "@/lib/quiz/create-quiz-questions";
import { QUIZ_RETURN_BANNER_KEY } from "@/lib/quiz/return-banner";
import { cn } from "@/lib/utils";

function DailyChallengeEntry() {
  const {
    dailyChallenge,
    isHydrated,
    isInProgress,
    isCompleted,
    correctCount,
    totalQuestions,
  } = useDailyChallenge();

  if (!isHydrated) {
    return null;
  }

  if (isCompleted && dailyChallenge) {
    return (
      <div className="flex flex-col gap-0.5 sm:items-end">
        <Link
          href="/daily"
          className="inline-flex items-center gap-1 rounded-sm text-left text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 sm:text-right"
        >
          <Check className="size-3.5 shrink-0" aria-hidden="true" />
          今日のChallenge完了
        </Link>
        <p className="text-left text-xs text-muted-foreground tabular-nums sm:text-right">
          {correctCount} / {totalQuestions}
        </p>
      </div>
    );
  }

  if (isInProgress && dailyChallenge) {
    const current = dailyChallenge.currentQuestionIndex + 1;
    const total = dailyChallenge.questions.length;
    return (
      <div className="flex flex-col gap-0.5 sm:items-end">
        <Link
          href="/daily"
          className="rounded-sm text-left text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 sm:text-right"
        >
          今日のChallengeを再開
        </Link>
        <p className="text-left text-xs text-muted-foreground tabular-nums sm:text-right">
          {current} / {total}問まで進行中
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 sm:items-end">
      <Link
        href="/daily"
        className="rounded-sm text-left text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 sm:text-right"
      >
        🔥 今日のChallenge
      </Link>
      <p className="text-left text-xs text-muted-foreground sm:text-right">
        1問だけ挑戦
      </p>
    </div>
  );
}

export default function VocabularyPage() {
  const { vocabularyItems, isLoading: isVocabularyLoading } = useVocabulary();
  const {
    isHydrated: isDailyHydrated,
    isInProgress,
    isCompleted,
  } = useDailyChallenge();
  const count = vocabularyItems.length;
  const hasItems = count > 0;
  const canQuiz = count >= QUIZ_MIN_ITEMS;
  const remaining = Math.max(0, QUIZ_MIN_ITEMS - count);
  const questionCount = Math.min(count, QUIZ_MAX_QUESTIONS);

  const hasTodayRecord = isInProgress || isCompleted;
  const showDailyEntry = isDailyHydrated && (hasTodayRecord || canQuiz);
  const showCtaBlock =
    !isVocabularyLoading && (hasItems || showDailyEntry);

  const [showReturnBanner, setShowReturnBanner] = useState(false);
  useEffect(() => {
    let raf = 0;
    try {
      if (sessionStorage.getItem(QUIZ_RETURN_BANNER_KEY)) {
        sessionStorage.removeItem(QUIZ_RETURN_BANNER_KEY);
        raf = requestAnimationFrame(() => setShowReturnBanner(true));
      }
    } catch {
      // sessionStorage may be unavailable; the banner is purely optional.
    }
    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, []);

  return (
    <div className={pageShellClassName}>
      <main
        className={cn(
          hasItems ? pageMainWideClassName : pageMainClassName,
          "min-w-0",
          hasItems ? "gap-2.5 sm:gap-3" : "gap-4"
        )}
      >
        <FadeIn>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className={cn(pageHeaderClassName, "space-y-1")}>
              <h1 className={pageTitleClassName}>単語帳</h1>
              <p className={cn(pageSubtitleClassName, "max-w-md text-[13px] sm:text-sm")}>
                保存した実況表現を練習して身につけます
              </p>
            </div>

            {showCtaBlock ? (
              <div className="flex w-full flex-col gap-1 sm:w-auto sm:items-end">
                {hasItems ? (
                  <>
                    {canQuiz ? (
                      <Button
                        size="lg"
                        nativeButton={false}
                        render={<Link href="/quiz" />}
                        aria-describedby="quiz-cta-hint"
                        className="h-10 w-full shrink-0 rounded-full px-4 sm:w-auto"
                      >
                        <GraduationCap className="size-4" aria-hidden="true" />
                        Quizに挑戦
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        disabled
                        aria-describedby="quiz-cta-hint"
                        className="h-10 w-full shrink-0 rounded-full bg-muted px-4 text-muted-foreground sm:w-auto"
                      >
                        <GraduationCap className="size-4" aria-hidden="true" />
                        Quizに挑戦
                      </Button>
                    )}
                    <p
                      id="quiz-cta-hint"
                      className={
                        canQuiz
                          ? "text-left text-[11px] text-muted-foreground sm:text-right"
                          : "text-left text-[11px] font-medium text-foreground/80 sm:text-right"
                      }
                    >
                      {canQuiz
                        ? `保存した表現から全${questionCount}問`
                        : `あと${remaining}件で開始できます`}
                    </p>
                    {!canQuiz ? (
                      <Link
                        href="/"
                        className="rounded-sm text-left text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 sm:text-right"
                      >
                        実況を作る
                      </Link>
                    ) : null}
                  </>
                ) : null}
                {showDailyEntry ? <DailyChallengeEntry /> : null}
              </div>
            ) : null}
          </header>
        </FadeIn>

        {showReturnBanner ? (
          <FadeIn>
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3 dark:border-primary/30 dark:bg-primary/10"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  お疲れさまでした！
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  また挑戦して英語実況を定着させましょう。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnBanner(false)}
                aria-label="メッセージを閉じる"
                className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </FadeIn>
        ) : null}

        {hasItems ? (
          <VocabularyWorkspace />
        ) : isVocabularyLoading ? (
          <VocabularyWorkspaceSkeleton />
        ) : (
          <FadeIn>
            <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
              <div className={emptyStateIconClassName}>
                <BookMarked className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  単語帳はまだ空です
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  気になる表現を追加して学習できます
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
        )}
      </main>
    </div>
  );
}
