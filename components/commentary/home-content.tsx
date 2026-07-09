"use client";

import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CommentaryForm } from "@/components/commentary/commentary-form";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import { FadeIn } from "@/components/ui/motion";
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
      <FadeIn>
        <header className="space-y-5 text-center sm:space-y-6 sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Soccer Commentary Lab
        </div>
        <div className="space-y-4 sm:space-y-5">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            サッカー実況を
            <br className="sm:hidden" />
            英語で学ぶ
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:mx-0 sm:text-lg sm:leading-8">
            日本語のサッカー実況を入力して、「変換」ボタンを押すと英語の実況フレーズに変換されます。
          </p>
        </div>
      </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section className="rounded-3xl border border-emerald-100/80 bg-card/90 p-5 shadow-xl shadow-emerald-200/25 backdrop-blur-sm sm:p-8 dark:border-emerald-900/50 dark:shadow-emerald-950/40">
          <CommentaryForm
            japaneseText={japaneseText}
            onJapaneseTextChange={setJapaneseText}
            translations={translations}
            onTranslationsChange={setTranslations}
          />
        </section>
      </FadeIn>
    </>
  );
}
