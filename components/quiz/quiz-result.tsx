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

const STAR_COUNT = 5;

/** Short, session-only rating derived from this run's accuracy. */
function getRating(
  accuracy: number,
  isPerfect: boolean
): { title: string; note: string; stars: number } {
  if (isPerfect || accuracy >= 80) {
    return {
      title: "Excellent",
      note: "しっかり身についています",
      stars: isPerfect || accuracy >= 90 ? 5 : 4,
    };
  }
  if (accuracy >= 50) {
    return {
      title: "Good",
      note: "もう一度挑戦して定着させましょう",
      stars: accuracy >= 60 ? 3 : 2,
    };
  }
  return {
    title: "Keep Going",
    note: "単語帳でもう一度確認しましょう",
    stars: 1,
  };
}

function StarRow({ filled }: { filled: number }) {
  const safeFilled = Math.min(STAR_COUNT, Math.max(0, filled));
  return (
    <p
      className="text-base tracking-[0.2em] text-amber-600/90 dark:text-amber-400/90"
      aria-label={`${safeFilled}つ星（5つ中）`}
    >
      <span aria-hidden="true">
        {"★".repeat(safeFilled)}
        {"☆".repeat(STAR_COUNT - safeFilled)}
      </span>
    </p>
  );
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
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <h1 className="sr-only">クイズ結果</h1>

      <div className="space-y-1.5 text-center">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
          <Trophy className="size-5" aria-hidden="true" />
        </span>
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
          {correct}
          <span className="text-xl text-muted-foreground sm:text-2xl">
            {" "}
            / {total}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          正答率{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {accuracy}%
          </span>
          <span className="text-muted-foreground/70"> · </span>
          最長連続{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {longestStreak}
          </span>
        </p>
      </div>

      <div className="space-y-1 text-center">
        <StarRow filled={rating.stars} />
        <p className="text-base font-semibold tracking-tight text-foreground">
          {rating.title}
        </p>
        <p className="text-sm text-muted-foreground">{rating.note}</p>
      </div>

      {isPerfect ? (
        <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5 text-center text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/25 dark:text-emerald-200">
          満点！この単語帳はしっかり身についています
        </p>
      ) : missedQuestions.length > 0 ? (
        <section aria-labelledby="missed-heading" className="min-w-0 space-y-2">
          <h2
            id="missed-heading"
            className="text-xs font-semibold text-muted-foreground"
          >
            復習したい表現（{missedQuestions.length}件）
          </h2>
          <ul className="space-y-1.5">
            {missedQuestions.map((question) => (
              <li
                key={question.id}
                className="min-w-0 space-y-0.5 rounded-lg border border-border/60 bg-card/70 px-2.5 py-2"
              >
                <p className="break-words text-xs text-muted-foreground">
                  {question.meaning}
                </p>
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">
                    {question.correctText}
                  </p>
                  <SpeechPlaybackButton
                    text={question.correctText}
                    variant="icon"
                    className="size-8 min-h-8 min-w-8 rounded-full [&_svg]:size-3.5"
                  />
                </div>
                {question.learningPoint?.text ? (
                  <p className="break-words text-[11px] text-muted-foreground">
                    {question.learningPoint.text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          onClick={onRetry}
          className="h-auto min-h-11 w-full flex-1 gap-2 rounded-full px-4 py-2.5 text-sm leading-snug whitespace-normal sm:w-auto"
        >
          <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
          {retryLabel}
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/vocabulary" onClick={markQuizReturn} />}
          className="h-auto min-h-11 w-full flex-1 gap-2 rounded-full px-4 py-2.5 text-sm leading-snug whitespace-normal sm:w-auto"
        >
          単語帳へ戻る
        </Button>
      </div>
    </div>
  );
}
