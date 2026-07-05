"use client";

import { useEffect, useState } from "react";

import { TranslationCardSkeleton } from "@/components/commentary/translation-card-skeleton";

const LOADING_MESSAGES = [
  "Premier League風実況を生成中…",
  "実況らしい英語表現を選んでいます…",
  "学習に役立つ解説を準備中…",
];

export function TranslationLoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  const message = LOADING_MESSAGES[messageIndex];

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600" />
        </span>
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {message}
        </p>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <TranslationCardSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
}
