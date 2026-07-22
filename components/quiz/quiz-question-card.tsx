"use client";

import { ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types/quiz";

const OPTION_MARKERS = ["1", "2", "3", "4"] as const;

/** Strip spacing/punctuation so a near-identical japaneseText can be hidden. */
function normalizeJapanese(value: string): string {
  return value.replace(/[\s！!。.、,？?]/g, "");
}

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selectedOptionId: string | null;
  isLast: boolean;
  streak: number;
  onSelect: (optionId: string) => void;
  onNext: () => void;
};

export function QuizQuestionCard({
  question,
  selectedOptionId,
  isLast,
  streak,
  onSelect,
  onNext,
}: QuizQuestionCardProps) {
  const answered = selectedOptionId !== null;
  const selectedOption = answered
    ? question.options.find((option) => option.id === selectedOptionId)
    : undefined;
  const selectedIsCorrect = selectedOption?.isCorrect ?? false;

  const showJapanese =
    question.japaneseText.trim().length > 0 &&
    normalizeJapanese(question.japaneseText) !==
      normalizeJapanese(question.meaning);

  const promptRef = useRef<HTMLDivElement | null>(null);
  const nextWrapRef = useRef<HTMLDivElement | null>(null);

  // Move focus to the prompt when a new question mounts so screen readers
  // announce the question and keyboard focus does not get lost.
  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  // After answering, move focus to the "next" action for smooth keyboard flow.
  useEffect(() => {
    if (answered) {
      nextWrapRef.current?.querySelector("button")?.focus();
    }
  }, [answered]);

  return (
    <div className="min-w-0 space-y-3">
      <section
        ref={promptRef}
        tabIndex={-1}
        aria-label="問題"
        className="min-w-0 space-y-1 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-4 sm:py-3.5"
      >
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          この実況英語は？
        </p>
        <p className="text-lg font-semibold leading-snug tracking-tight text-balance break-words text-foreground sm:text-xl">
          {question.meaning}
        </p>
        {showJapanese ? (
          <p className="break-words text-xs leading-snug text-muted-foreground sm:text-sm">
            元の日本語 · {question.japaneseText}
          </p>
        ) : null}
      </section>

      {!answered ? (
        <p className="px-0.5 text-[11px] text-muted-foreground">
          タップで回答 · キーボード 1〜4
        </p>
      ) : null}

      <ul className="min-w-0 space-y-2" aria-label="選択肢">
        {question.options.map((option, index) => {
          const isSelected = option.id === selectedOptionId;
          const showCorrect = answered && option.isCorrect;
          const showWrong = answered && isSelected && !option.isCorrect;
          const isDimmed = answered && !showCorrect && !showWrong;

          let stateLabel = "";
          if (showCorrect) {
            stateLabel = "正解";
          } else if (showWrong) {
            stateLabel = "あなたの回答・不正解";
          }

          return (
            <li key={option.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                disabled={answered}
                aria-label={`選択肢${index + 1}：${option.englishText}${
                  stateLabel ? `（${stateLabel}）` : ""
                }`}
                className={cn(
                  "flex min-h-12 w-full min-w-0 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:cursor-default sm:min-h-11 motion-reduce:transition-none",
                  !answered &&
                    "border-border/80 bg-background hover:border-primary/35 hover:bg-primary/[0.04]",
                  showCorrect &&
                    "border-emerald-300/90 bg-emerald-50/80 dark:border-emerald-700/70 dark:bg-emerald-950/40",
                  showWrong &&
                    "border-rose-300/80 bg-rose-50/70 dark:border-rose-800/60 dark:bg-rose-950/30",
                  isDimmed && "border-border/50 bg-muted/15 opacity-70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums",
                    showCorrect
                      ? "border-emerald-500 bg-emerald-500 text-white dark:text-emerald-950"
                      : showWrong
                        ? "border-rose-400 bg-rose-400 text-white"
                        : "border-border/80 bg-muted/50 text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {showCorrect ? (
                    <Check className="size-3.5" />
                  ) : showWrong ? (
                    <X className="size-3.5" />
                  ) : (
                    OPTION_MARKERS[index]
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words text-sm font-medium leading-snug sm:text-[15px]",
                    isDimmed ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {option.englishText}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered ? (
        <div
          className={cn(
            "min-w-0 space-y-2.5 rounded-xl border p-3 sm:p-3.5",
            selectedIsCorrect
              ? "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/25"
              : "border-rose-200/70 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                selectedIsCorrect ? "bg-emerald-500" : "bg-rose-400"
              )}
              aria-hidden="true"
            >
              {selectedIsCorrect ? (
                <Check className="size-3.5" />
              ) : (
                <X className="size-3.5" />
              )}
            </span>
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "text-sm font-semibold sm:text-base",
                selectedIsCorrect
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-rose-700 dark:text-rose-300"
              )}
            >
              {selectedIsCorrect ? "正解！" : "惜しい！"}
            </p>
            {selectedIsCorrect && streak >= 2 ? (
              <span
                className="ml-auto inline-flex items-center rounded-full bg-primary/[0.1] px-2 py-0.5 text-[11px] font-medium text-primary tabular-nums"
                aria-hidden="true"
              >
                {streak}連続正解
              </span>
            ) : null}
          </div>

          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {selectedIsCorrect ? "正解の英語実況" : "正解はこちら"}
            </p>
            <div className="flex min-w-0 items-start gap-2">
              <p className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground sm:text-base">
                {question.correctText}
              </p>
              <SpeechPlaybackButton
                text={question.correctText}
                variant="icon"
                className="size-9 min-h-9 min-w-9 rounded-full [&_svg]:size-4"
              />
            </div>
          </div>

          {question.learningPoint?.text ? (
            <div className="min-w-0 space-y-0.5 rounded-lg border border-primary/20 bg-primary/[0.04] px-2.5 py-2">
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
                <Lightbulb className="size-3" aria-hidden="true" />
                覚えるポイント
              </p>
              <p className="break-words text-sm font-semibold text-foreground">
                {question.learningPoint.text}
              </p>
              {question.learningPoint.meaning ? (
                <p className="break-words text-xs leading-snug text-muted-foreground">
                  {question.learningPoint.meaning}
                </p>
              ) : null}
            </div>
          ) : null}

          <div ref={nextWrapRef} className="pt-0.5 sm:flex sm:justify-end">
            <Button
              type="button"
              size="lg"
              onClick={onNext}
              className="h-11 w-full rounded-full sm:w-auto sm:min-w-[11rem]"
            >
              {isLast ? "結果を見る" : "次の問題へ"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
