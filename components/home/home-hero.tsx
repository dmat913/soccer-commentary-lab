"use client";

import { Check, Sparkles, Wand2 } from "lucide-react";

import { FadeIn, Float } from "@/components/ui/motion";

const infoBadges = [
  "無料で利用できます",
  "ログインするとお気に入り・履歴を保存",
] as const;

export function HomeHero() {
  return (
    <FadeIn duration={0.7} y={18}>
      <header className="relative space-y-3.5 py-1 text-center sm:space-y-5 sm:py-3 sm:text-left">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 h-56 w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.22),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),transparent_70%)] sm:left-0 sm:translate-x-0"
        />

        <div className="relative flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
          <Float>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/95 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 shadow-md shadow-emerald-200/40 sm:gap-2 sm:px-4 sm:py-1.5 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:shadow-emerald-950/40">
              <Wand2 className="size-3.5" aria-hidden="true" />
              AI Powered
            </div>
          </Float>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 shadow-sm backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-1.5 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Sparkles className="size-3.5" aria-hidden="true" />
              KickLingo
            </div>
        </div>

        <div className="relative space-y-2 sm:space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground max-sm:text-3xl max-sm:leading-[1.12] sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            サッカー実況を
            <br className="sm:hidden" />
            英語で学ぶ
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground max-sm:text-sm max-sm:leading-6 sm:mx-0 sm:text-lg sm:leading-8">
            日本語のサッカー実況を入力して、「変換」ボタンを押すと英語の実況フレーズに変換されます。
          </p>
        </div>

        <ul className="relative flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
          {infoBadges.map((label) => (
            <li key={label}>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-white/80 px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur-sm sm:gap-1.5 sm:px-3 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                <Check
                  className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </header>
    </FadeIn>
  );
}
