"use client";

import { Sparkles } from "lucide-react";

import type { ExampleItem } from "@/lib/examples/types";
import { cn } from "@/lib/utils";

type HomeEmptyExamplesProps = {
  japaneseText: string;
  examples: ExampleItem[];
  onSelectExample: (text: string) => void;
};

export function HomeEmptyExamples({
  japaneseText,
  examples,
  onSelectExample,
}: HomeEmptyExamplesProps) {
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-3xl space-y-2"
      aria-label="例文から試す"
    >
      <header className="flex items-center gap-1.5">
        <Sparkles
          className="size-3 shrink-0 text-primary/70"
          aria-hidden="true"
        />
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          もっと長い例
        </h3>
      </header>
      <ul className="flex flex-wrap gap-2">
        {examples.map((example) => {
          const isSelected = japaneseText === example.text;

          return (
            <li key={example.id} className="min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => onSelectExample(example.text)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex max-w-full min-h-9 items-center rounded-full border px-3 py-1.5 text-left text-xs leading-snug",
                  "transition-all duration-200 ease-out active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary/40 bg-primary/[0.08] text-primary"
                    : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className="break-words">{example.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
