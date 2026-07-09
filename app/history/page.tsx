"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";

import { CommentaryHistory } from "@/components/commentary/commentary-history";
import { FadeIn } from "@/components/ui/motion";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import type { CommentaryHistoryItem } from "@/types/history";

export default function HistoryPage() {
  const router = useRouter();
  const history = useCommentaryHistory();

  function handleHistorySelect(item: CommentaryHistoryItem) {
    router.push(`/?restore=${item.id}`);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {history.length === 0 ? (
          <FadeIn>
            <section className="space-y-5">
              <header className="space-y-2">
                <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <History className="size-5" aria-hidden="true" />
                  <h1 className="text-2xl font-bold tracking-tight">履歴</h1>
                </div>
                <p className="text-muted-foreground">
                  過去の変換結果を振り返れます。
                </p>
              </header>
              <p className="rounded-3xl border border-dashed border-emerald-200/80 bg-card/70 p-8 text-sm text-muted-foreground shadow-sm dark:border-emerald-800">
                履歴はまだありません。Home で変換するとここに保存されます。
              </p>
            </section>
          </FadeIn>
        ) : (
          <FadeIn>
            <CommentaryHistory items={history} onSelect={handleHistorySelect} />
          </FadeIn>
        )}
      </main>
    </div>
  );
}
