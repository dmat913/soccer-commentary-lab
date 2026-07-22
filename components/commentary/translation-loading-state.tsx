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
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-w-0 space-y-4"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
        <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
          {shouldReduceMotion ? (
            <span className="inline-flex size-2.5 rounded-full bg-muted-foreground/70" />
          ) : (
            <motion.span
              className="inline-flex size-2.5 rounded-full bg-muted-foreground/70"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            英語実況を生成中…
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            場面に合った3つの自然な英語実況を作成しています
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={
          compact
            ? "grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3 lg:items-start"
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
