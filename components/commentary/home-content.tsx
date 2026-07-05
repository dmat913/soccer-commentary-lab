"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CommentaryForm } from "@/components/commentary/commentary-form";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import type { CommentaryTranslationItem } from "@/types/commentary";

export function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const history = useCommentaryHistory();
  const restoredIdRef = useRef<string | null>(null);

  const [japaneseText, setJapaneseText] = useState("");
  const [translations, setTranslations] = useState<CommentaryTranslationItem[]>(
    []
  );

  useEffect(() => {
    const restoreId = searchParams.get("restore");
    if (!restoreId || restoredIdRef.current === restoreId) {
      return;
    }

    const item = history.find((entry) => entry.id === restoreId);
    if (!item) {
      return;
    }

    restoredIdRef.current = restoreId;
    setJapaneseText(item.japaneseText);
    setTranslations(item.translations);
    router.replace("/", { scroll: false });

    requestAnimationFrame(() => {
      document.getElementById("commentary-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [searchParams, history, router]);

  return (
    <>
      <header className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          Soccer Commentary Lab
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          サッカー実況を英語で学ぶ
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          日本語のサッカー実況を入力して、「変換」ボタンを押すと英語の実況フレーズに変換されます。
        </p>
      </header>

      <section className="rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-8">
        <CommentaryForm
          japaneseText={japaneseText}
          onJapaneseTextChange={setJapaneseText}
          translations={translations}
          onTranslationsChange={setTranslations}
        />
      </section>
    </>
  );
}
