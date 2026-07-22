"use client";

import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

type QuizProgressProps = {
  current: number;
  total: number;
  answered: number;
  streak: number;
  /** Optional session label shown on the left (e.g. "Quiz"). */
  label?: string;
};

export function QuizProgress({
  current,
  total,
  answered,
  streak,
  label,
}: QuizProgressProps) {
  const percent =
    total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
  const showStreak = streak >= 1;
  const isHotStreak = streak >= 2;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {label ? (
            <p className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
              {label}
            </p>
          ) : null}
          <p
            className="text-sm tabular-nums"
            aria-label={`${current}問目 / 全${total}問`}
          >
            <span className="font-semibold text-foreground">{current}</span>
            <span className="text-muted-foreground"> / {total}</span>
          </p>
        </div>

        {showStreak ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
              isHotStreak
                ? "bg-primary/[0.12] text-primary"
                : "bg-muted/70 text-muted-foreground"
            )}
          >
            {isHotStreak ? (
              <Flame className="size-3 text-primary" aria-hidden="true" />
            ) : null}
            {streak}連続正解
          </p>
        ) : null}
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-label={`クイズの進捗：全${total}問中${answered}問回答済み`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
