"use client";

import { RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";

import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { Button } from "@/components/ui/button";
import { QUIZ_RETURN_BANNER_KEY } from "@/lib/quiz/return-banner";
import type { QuizSessionResult } from "@/types/quiz";

type QuizResultProps = {
  result: QuizSessionResult;
  onRetry: () => void;
  /** Label for the primary action. Defaults to the practice Quiz's "もう一度挑戦". */
  retryLabel?: string;
};

/** Short, session-only rating derived from this run's accuracy. */
function getRating(
  accuracy: number,
  isPerfect: boolean
): { title: string; note: string } {
  if (isPerfect) {
    return { title: "Perfect Match!", note: "全問正解です！" };
  }
  if (accuracy >= 80) {
    return { title: "Great Performance!", note: "かなり定着しています。" };
  }
  if (accuracy >= 50) {
    return { title: "Good Effort!", note: "あと少しです。" };
  }
  return { title: "Keep Going!", note: "もう一度挑戦してみましょう。" };
}

export function QuizResult({
  result,
  onRetry,
  retryLabel = "もう一度挑戦",
}: QuizResultProps) {
  const { total, correct, longestStreak, missedQuestions } = result;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;
  const rating = getRating(accuracy, isPerfect);

  // Signal the Vocabulary page to show a one-time "welcome back" banner.
  // Session-only; the page clears it immediately after reading.
  function markQuizReturn() {
    try {
      sessionStorage.setItem(QUIZ_RETURN_BANNER_KEY, "1");
    } catch {
      // sessionStorage may be unavailable (private mode); banner is optional.
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <h1 className="sr-only">クイズ結果</h1>

      <div className="space-y-2 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <Trophy className="size-6" aria-hidden="true" />
        </span>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-700/80 uppercase dark:text-emerald-300/80">
          Full-time
        </p>
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {correct}
          <span className="text-xl text-muted-foreground"> / {total}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          正答率{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {accuracy}%
          </span>
        </p>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
          {rating.title}
        </p>
        <p className="text-sm text-muted-foreground">{rating.note}</p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        最長連続正解{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {longestStreak}
        </span>
      </p>

      {isPerfect ? (
        <p className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/25 dark:text-emerald-200">
          満点！この単語帳はしっかり身についています
        </p>
      ) : (
        <section aria-labelledby="missed-heading" className="min-w-0 space-y-2.5">
          <h2 id="missed-heading" className="text-sm font-semibold text-foreground">
            復習したい表現（{missedQuestions.length}件）
          </h2>
          <ul className="space-y-2">
            {missedQuestions.map((question) => (
              <li
                key={question.id}
                className="min-w-0 space-y-0.5 rounded-2xl border border-border/60 bg-card/60 p-3"
              >
                <p className="break-words text-sm text-muted-foreground">
                  {question.meaning}
                </p>
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 break-words text-base font-semibold text-foreground">
                    {question.correctText}
                  </p>
                  <SpeechPlaybackButton
                    text={question.correctText}
                    variant="icon"
                    className="size-9 min-h-9 min-w-9"
                  />
                </div>
                {question.learningPoint?.text ? (
                  <p className="break-words text-xs text-emerald-800/90 dark:text-emerald-300/90">
                    {question.learningPoint.text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button
          type="button"
          size="lg"
          variant={isPerfect ? "outline" : "default"}
          onClick={onRetry}
          className={
            isPerfect
              ? "h-11 flex-1 rounded-full"
              : "h-11 flex-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          }
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {retryLabel}
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/vocabulary" onClick={markQuizReturn} />}
          className="h-11 flex-1 rounded-full"
        >
          単語帳へ戻る
        </Button>
      </div>
    </div>
  );
}
