"use client";

import { History } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, HoverLift } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import type { CommentaryHistoryItem } from "@/types/history";

type CommentaryHistoryProps = {
  items: CommentaryHistoryItem[];
  selectedId?: string | null;
  onSelect: (item: CommentaryHistoryItem) => void;
};

function formatSavedAt(savedAt: string): string {
  return new Date(savedAt).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentaryHistory({
  items,
  selectedId,
  onSelect,
}: CommentaryHistoryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">履歴</h1>
        <p className="text-muted-foreground">
          過去の変換結果を振り返れます。クリックで Home に復元できます。
        </p>
      </header>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <FadeIn key={item.id} delay={index * 0.04}>
            <HoverLift>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded-3xl border border-emerald-100/70 bg-card/90 shadow-md shadow-emerald-100/30 transition-shadow hover:shadow-lg hover:shadow-emerald-200/40 dark:border-emerald-900/40 dark:shadow-emerald-950/30 dark:hover:shadow-emerald-900/40",
                  selectedId === item.id &&
                    "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-300/50 dark:border-emerald-700 dark:bg-emerald-950/30 dark:ring-emerald-800/50"
                )}
              >
                <CardContent className="flex gap-4 p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <History className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {formatSavedAt(item.savedAt)}
                    </p>
                    <p className="text-base leading-relaxed font-bold">
                      {item.japaneseText}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.translations.map((translation, translationIndex) => (
                        <span
                          key={`${item.id}-${translationIndex}`}
                          className="inline-flex max-w-full items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                        >
                          <span className="truncate">{translation.text}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
