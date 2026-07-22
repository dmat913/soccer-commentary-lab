"use client";

import { Lightbulb } from "lucide-react";

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

const panelBase =
  "rounded-xl border border-border/70 bg-card/80 shadow-none";

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
    <section
      aria-label="学習記録"
      className={cn(panelBase, "px-3 py-2.5", className)}
    >
      <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        学習記録
      </h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 space-y-0.5">
            <dt className="truncate text-[10px] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="flex items-baseline gap-0.5">
              <span className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {stat.unit}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
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
    <section
      aria-label="よく使う表現"
      className={cn(panelBase, "px-3 py-2.5", className)}
    >
      <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        よく使う表現
      </h2>
      <ol className="mt-2 space-y-1.5">
        {expressions.map((expression, index) => (
          <li
            key={`${expression.text}-${index}`}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="line-clamp-1 min-w-0 flex-1 text-[13px] leading-snug text-foreground/90">
              {expression.text}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {expression.count}回
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LearningTip({ className }: { className?: string }) {
  return (
    <section
      aria-label="学習のコツ"
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 shadow-none",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Lightbulb
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
          学習のコツ
        </h2>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        声に出して読むことで、実況表現をより効果的に覚えられます。
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
        実際の実況のように感情を込めて読んでみましょう。
      </p>
    </section>
  );
}
