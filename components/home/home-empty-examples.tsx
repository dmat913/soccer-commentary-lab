"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const EMPTY_STATE_EXAMPLES = [
  "ゴール前でこぼれ球を押し込んだ！",
  "鋭いスルーパスから決定機！",
  "キーパーが片手でスーパーセーブ！",
] as const;

type HomeEmptyExamplesProps = {
  japaneseText: string;
  onSelectExample: (text: string) => void;
};

export function HomeEmptyExamples({
  japaneseText,
  onSelectExample,
}: HomeEmptyExamplesProps) {
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-3xl space-y-2"
      aria-label="例文から試す"
    >
      <header className="flex items-center gap-1.5">
        <Sparkles
          className="size-3 shrink-0 text-emerald-600/70 dark:text-emerald-400/70"
          aria-hidden="true"
        />
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          例から試す
        </h3>
      </header>
      <ul className="flex flex-wrap gap-2">
        {EMPTY_STATE_EXAMPLES.map((example) => {
          const isSelected = japaneseText === example;

          return (
            <li key={example} className="min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => onSelectExample(example)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex max-w-full min-h-9 items-center rounded-full border px-3 py-1.5 text-left text-xs leading-snug",
                  "transition-all duration-200 ease-out active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-emerald-400/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "border-border/70 bg-muted/30 text-muted-foreground hover:border-emerald-200/70 hover:bg-emerald-50/70 hover:text-emerald-800 dark:hover:border-emerald-800/50 dark:hover:bg-emerald-950/35 dark:hover:text-emerald-200"
                )}
              >
                <span className="break-words">{example}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
