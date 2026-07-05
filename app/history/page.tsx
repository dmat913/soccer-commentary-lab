"use client";

import { useRouter } from "next/navigation";

import { CommentaryHistory } from "@/components/commentary/commentary-history";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import type { CommentaryHistoryItem } from "@/types/history";

export default function HistoryPage() {
  const router = useRouter();
  const history = useCommentaryHistory();

  function handleHistorySelect(item: CommentaryHistoryItem) {
    router.push(`/?restore=${item.id}`);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/25">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {history.length === 0 ? (
          <section className="space-y-4">
            <header className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">履歴</h1>
              <p className="text-muted-foreground">
                過去の変換結果を振り返れます。
              </p>
            </header>
            <p className="rounded-2xl border border-dashed border-emerald-200 bg-card/60 p-6 text-sm text-muted-foreground dark:border-emerald-800">
              履歴はまだありません。Home で変換するとここに保存されます。
            </p>
          </section>
        ) : (
          <CommentaryHistory items={history} onSelect={handleHistorySelect} />
        )}
      </main>
    </div>
  );
}
