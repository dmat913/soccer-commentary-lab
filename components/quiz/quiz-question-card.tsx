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
    <div className="min-w-0 space-y-4">
      <section
        ref={promptRef}
        tabIndex={-1}
        aria-label="問題"
        className="min-w-0 space-y-1.5 rounded-3xl border border-emerald-100/80 bg-white/95 p-4 shadow-sm shadow-emerald-100/40 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 sm:p-6 dark:border-emerald-900/50 dark:bg-emerald-950/35"
      >
        <p className="text-[11px] font-semibold tracking-wider text-emerald-700/80 uppercase dark:text-emerald-300/80">
          この実況英語は？
        </p>
        <p className="text-xl leading-snug font-semibold tracking-tight text-balance break-words text-foreground sm:text-2xl">
          {question.meaning}
        </p>
        {showJapanese ? (
          <p className="break-words text-sm leading-relaxed text-muted-foreground">
            元の日本語：{question.japaneseText}
          </p>
        ) : null}
      </section>

      <ul className="min-w-0 space-y-2.5" aria-label="選択肢">
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
                  "flex min-h-14 w-full min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-1 disabled:cursor-default",
                  !answered &&
                    "border-border bg-background hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30",
                  showCorrect &&
                    "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/50",
                  showWrong &&
                    "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40",
                  isDimmed && "border-border/60 bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                    showCorrect
                      ? "border-emerald-500 bg-emerald-500 text-white dark:text-emerald-950"
                      : showWrong
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-border bg-muted/60 text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {showCorrect ? (
                    <Check className="size-4" />
                  ) : showWrong ? (
                    <X className="size-4" />
                  ) : (
                    OPTION_MARKERS[index]
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words text-sm font-medium sm:text-base",
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
            "min-w-0 space-y-3 rounded-2xl border p-4",
            selectedIsCorrect
              ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/25"
              : "border-red-200/70 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                selectedIsCorrect ? "bg-emerald-500" : "bg-red-400"
              )}
              aria-hidden="true"
            >
              {selectedIsCorrect ? (
                <Check className="size-4" />
              ) : (
                <X className="size-4" />
              )}
            </span>
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "text-base font-semibold",
                selectedIsCorrect
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-red-700 dark:text-red-300"
              )}
            >
              {selectedIsCorrect ? "正解！" : "惜しい！"}
            </p>
            {selectedIsCorrect && streak >= 2 ? (
              <span
                className="ml-auto inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 tabular-nums dark:bg-emerald-900/60 dark:text-emerald-200"
                aria-hidden="true"
              >
                {streak}連続正解
              </span>
            ) : null}
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              正解の英語実況
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
          </div>

          {question.learningPoint?.text ? (
            <div className="min-w-0 space-y-1 rounded-xl border border-emerald-200/60 bg-white/70 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                <Lightbulb className="size-3" aria-hidden="true" />
                覚えるポイント
              </p>
              <p className="break-words text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                {question.learningPoint.text}
              </p>
              {question.learningPoint.meaning ? (
                <p className="break-words text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
                  {question.learningPoint.meaning}
                </p>
              ) : null}
            </div>
          ) : null}

          <div ref={nextWrapRef}>
            <Button
              type="button"
              size="lg"
              onClick={onNext}
              className="h-11 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isLast ? "結果を見る" : "次の問題"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
