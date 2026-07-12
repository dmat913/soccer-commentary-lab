"use client";

import { Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatItem = {
  label: string;
  value: number;
  unit: string;
};

export type FrequentExpression = {
  text: string;
  count: number;
};

const cardBase =
  "rounded-2xl border border-border/60 bg-card shadow-xs dark:border-border/50";

export function HistoryStats({
  conversions,
  expressions,
  favorites,
  studyDays,
  className,
}: {
  conversions: number;
  expressions: number;
  favorites: number;
  studyDays: number;
  className?: string;
}) {
  const stats: StatItem[] = [
    { label: "変換した回数", value: conversions, unit: "回" },
    { label: "学習した表現数", value: expressions, unit: "件" },
    { label: "お気に入り数", value: favorites, unit: "件" },
    { label: "学習日数", value: studyDays, unit: "日" },
  ];

  return (
    <Card className={cn(cardBase, className)}>
      <CardContent className="p-4">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
          学習記録
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 space-y-0.5">
              <dt className="truncate text-[11px] text-muted-foreground/70">
                {stat.label}
              </dt>
              <dd className="flex items-baseline gap-1">
                <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {stat.unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function FrequentExpressions({
  expressions,
  className,
}: {
  expressions: FrequentExpression[];
  className?: string;
}) {
  if (expressions.length === 0) {
    return null;
  }

  return (
    <Card className={cn(cardBase, className)}>
      <CardContent className="p-4">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
          よく使う表現
        </h2>
        <ol className="mt-3 space-y-2">
          {expressions.map((expression, index) => (
            <li
              key={`${expression.text}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              <span className="line-clamp-1 min-w-0 flex-1 text-sm text-foreground/90">
                {expression.text}
              </span>
              <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums dark:bg-muted/40">
                {expression.count}回
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function LearningTip({ className }: { className?: string }) {
  return (
    <Card className={cn(cardBase, className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Lightbulb
            className="size-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
            学習のコツ
          </h2>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
          声に出して読むことで、実況表現をより効果的に覚えられます。
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          実際の実況のように感情を込めて読んでみましょう。
        </p>
      </CardContent>
    </Card>
  );
}
