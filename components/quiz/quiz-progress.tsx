"use client";

import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

type QuizProgressProps = {
  current: number;
  total: number;
  answered: number;
  streak: number;
};

export function QuizProgress({
  current,
  total,
  answered,
  streak,
}: QuizProgressProps) {
  const percent =
    total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
  const showStreak = streak >= 1;
  const isHotStreak = streak >= 2;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-sm tabular-nums"
          aria-label={`${current}問目 / 全${total}問`}
        >
          <span className="text-base font-semibold text-foreground">
            {current}
          </span>
          <span className="text-muted-foreground"> / {total}</span>
        </p>

        {showStreak ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
              isHotStreak
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                : "bg-muted/70 text-muted-foreground"
            )}
          >
            {isHotStreak ? (
              <Flame
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
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
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
