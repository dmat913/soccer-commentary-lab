"use client";

import { BookMarked, Check, GraduationCap, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { VocabularyWorkspace } from "@/components/vocabulary/vocabulary-workspace";
import { useDailyChallenge } from "@/hooks/use-daily-challenge";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  QUIZ_MAX_QUESTIONS,
  QUIZ_MIN_ITEMS,
} from "@/lib/quiz/create-quiz-questions";
import { QUIZ_RETURN_BANNER_KEY } from "@/lib/quiz/return-banner";

const EMPTY_STEPS = [
  "Homeで英語実況を作る",
  "覚えたい表現を単語帳へ追加する",
  `${QUIZ_MIN_ITEMS}件以上集めてQuizに挑戦する`,
] as const;

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
          className="inline-flex items-center gap-1 rounded-sm text-left text-xs font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:text-right dark:text-emerald-400"
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
          className="rounded-sm text-left text-xs font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:text-right dark:text-emerald-400"
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
        className="rounded-sm text-left text-xs font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:text-right dark:text-emerald-400"
      >
        🔥 今日のChallenge
      </Link>
      <p className="text-left text-xs text-muted-foreground sm:text-right">
        5問だけ挑戦
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
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <FadeIn>
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                単語帳
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                学習する実況英語を管理しましょう
              </p>
            </div>

            {showCtaBlock ? (
              <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
                {hasItems ? (
                  <>
                    {canQuiz ? (
                      <Button
                        size="lg"
                        nativeButton={false}
                        render={<Link href="/quiz" />}
                        aria-describedby="quiz-cta-hint"
                        className="h-11 w-full shrink-0 rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700 sm:w-auto"
                      >
                        <GraduationCap className="size-4" aria-hidden="true" />
                        Quizを始める
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        disabled
                        aria-describedby="quiz-cta-hint"
                        className="h-11 w-full shrink-0 rounded-full bg-muted px-5 text-muted-foreground sm:w-auto"
                      >
                        <GraduationCap className="size-4" aria-hidden="true" />
                        Quizを始める
                      </Button>
                    )}
                    <p
                      id="quiz-cta-hint"
                      className={
                        canQuiz
                          ? "text-left text-xs text-muted-foreground sm:text-right"
                          : "text-left text-xs font-medium text-foreground/80 sm:text-right"
                      }
                    >
                      {canQuiz
                        ? `保存した表現から全${questionCount}問に挑戦`
                        : `あと${remaining}件でQuizを開始できます`}
                    </p>
                    {!canQuiz ? (
                      <Link
                        href="/"
                        className="rounded-sm text-left text-xs font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:text-right dark:text-emerald-400"
                      >
                        Homeで表現を追加する
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
              className="flex items-start gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/25"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  お疲れさまでした！
                </p>
                <p className="text-sm leading-relaxed text-emerald-800/90 dark:text-emerald-200/80">
                  また挑戦して英語実況を定着させましょう。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnBanner(false)}
                aria-label="メッセージを閉じる"
                className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700/70 transition-colors hover:bg-emerald-100/70 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-300/70 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-100"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </FadeIn>
        ) : null}

        {hasItems ? (
          <VocabularyWorkspace />
        ) : isVocabularyLoading ? (
          <p
            role="status"
            aria-live="polite"
            className="py-12 text-center text-sm text-muted-foreground sm:py-16"
          >
            単語帳を読み込んでいます…
          </p>
        ) : (
          <FadeIn>
            <div className="flex flex-col items-center gap-4 py-12 text-center sm:py-16">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <BookMarked className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  単語帳はまだ空です
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Homeで英語実況を作り、覚えたい表現を単語帳へ追加すると、ここに表示されます
                </p>
              </div>
              <ol className="mx-auto w-full max-w-xs space-y-2 text-left">
                {EMPTY_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-1 rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700"
              >
                英語実況を作る
              </Button>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
