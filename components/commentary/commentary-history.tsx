"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">履歴</h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card
            key={item.id}
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
              "cursor-pointer shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20",
              selectedId === item.id &&
                "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/30"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {formatSavedAt(item.savedAt)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{item.japaneseText}</p>
              <ul className="space-y-1 border-t pt-3">
                {item.translations.map((translation, index) => (
                  <li
                    key={`${item.id}-${index}`}
                    className="text-sm text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {translation.text}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
