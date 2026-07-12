"use client";

import { motion, useReducedMotion } from "framer-motion";

import { TranslationCardSkeleton } from "@/components/commentary/translation-card-skeleton";

type TranslationLoadingStateProps = {
  compact?: boolean;
};

export function TranslationLoadingState({
  compact = false,
}: TranslationLoadingStateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-w-0 space-y-4" aria-busy="true">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
          {shouldReduceMotion ? (
            <span className="inline-flex size-2.5 rounded-full bg-emerald-600" />
          ) : (
            <motion.span
              className="inline-flex size-2.5 rounded-full bg-emerald-600"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            英語実況を生成中…
          </p>
          <p className="text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-400/80">
            場面に合った3つの自然な英語実況を作成しています
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={
          compact
            ? "grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch"
            : "grid gap-4"
        }
      >
        {Array.from({ length: 3 }, (_, index) => (
          <TranslationCardSkeleton
            key={index}
            index={index}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
