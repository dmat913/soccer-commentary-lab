"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommentaryHistoryItem } from "@/types/history";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

type CommentaryHistoryProps = {
  items: CommentaryHistoryItem[];
  selectedId?: string | null;
  onSelect: (item: CommentaryHistoryItem) => void;
  onDelete: (id: string) => void;
};

function formatSavedAt(savedAt: string): string {
  if (!savedAt) {
    return "";
  }

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCandidateIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function CommentaryHistory({
  items,
  selectedId,
  onSelect,
  onDelete,
}: CommentaryHistoryProps) {
  const shouldReduceMotion = useReducedMotion();

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="変換履歴一覧" className="grid min-w-0 gap-2">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const savedAtLabel = formatSavedAt(item.savedAt);

          return (
            <motion.div
              key={item.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: easeOut }}
              className="min-w-0"
            >
              <article
                className={cn(
                  "w-full min-w-0 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-xs transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
                  "hover:border-border hover:shadow-sm",
                  selectedId === item.id &&
                    "border-primary/40 ring-1 ring-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  {savedAtLabel ? (
                    <time
                      dateTime={item.savedAt}
                      className="text-[10px] leading-none text-muted-foreground tabular-nums"
                    >
                      {savedAtLabel}
                    </time>
                  ) : (
                    <span className="sr-only">日時不明</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    aria-label="この履歴を削除"
                    className="size-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>

                <h2 className="mt-1 line-clamp-2 break-words text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                  {item.japaneseText}
                </h2>

                <ol className="mt-1.5 space-y-0.5">
                  {item.translations.map((translation, translationIndex) => (
                    <li
                      key={`${item.id}-${translationIndex}`}
                      className="flex min-w-0 items-baseline gap-1.5 text-[11px] leading-snug text-foreground/80 sm:text-xs"
                    >
                      <span
                        className="shrink-0 font-mono text-[10px] font-semibold text-muted-foreground tabular-nums"
                        aria-hidden="true"
                      >
                        {formatCandidateIndex(translationIndex)}
                      </span>
                      <span className="min-w-0 line-clamp-1 break-words">
                        {translation.text}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSelect(item)}
                    className="h-9 min-h-9 w-full gap-1.5 rounded-full border-border/80 px-3 text-xs font-medium sm:w-auto"
                  >
                    この結果を開く
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
