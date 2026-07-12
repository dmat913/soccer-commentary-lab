"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageSquare, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CommentaryHistoryItem } from "@/types/history";

const easeOut = [0.25, 0.1, 0.25, 1] as const;
const CANDIDATE_MARKERS = ["①", "②", "③"] as const;

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <section aria-label="変換履歴一覧" className="grid min-w-0 gap-2.5">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const savedAtLabel = formatSavedAt(item.savedAt);

          return (
            <motion.div
              key={item.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: easeOut }}
              className="min-w-0"
            >
              <Card
                className={cn(
                  "w-full min-w-0 gap-0 rounded-2xl border border-border/60 bg-card py-0 shadow-xs transition-[border-color,box-shadow] duration-200 ease-out hover:border-emerald-300/70 hover:shadow-sm dark:border-border/50 dark:hover:border-emerald-700/60",
                  selectedId === item.id &&
                    "border-emerald-400 ring-1 ring-emerald-300/50 dark:border-emerald-700 dark:ring-emerald-800/50"
                )}
              >
                <CardContent className="flex min-w-0 flex-col gap-3 p-3.5 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground dark:bg-muted/40">
                    <MessageSquare className="size-4" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    {savedAtLabel ? (
                      <p className="text-[11px] text-muted-foreground/70">
                        {savedAtLabel}
                      </p>
                    ) : null}

                    <p className="line-clamp-2 break-words text-sm leading-snug font-semibold text-foreground sm:text-[0.95rem]">
                      {item.japaneseText}
                    </p>

                    <ul className="flex min-w-0 flex-wrap gap-1.5">
                      {item.translations.map((translation, translationIndex) => (
                        <li
                          key={`${item.id}-${translationIndex}`}
                          className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-emerald-50/70 px-2 py-0.5 text-xs text-emerald-900/80 dark:bg-emerald-950/30 dark:text-emerald-100/80"
                        >
                          <span
                            className="shrink-0 text-emerald-600/70 dark:text-emerald-400/70"
                            aria-hidden="true"
                          >
                            {CANDIDATE_MARKERS[translationIndex] ??
                              String(translationIndex + 1)}
                          </span>
                          <span className="truncate">{translation.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-1 sm:self-start">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSelect(item)}
                      className="h-9 gap-1.5 rounded-full px-3.5 text-xs"
                    >
                      この結果を開く
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => onDelete(item.id)}
                      aria-label="この履歴を削除"
                      className="size-11 min-h-11 min-w-11 rounded-full text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
