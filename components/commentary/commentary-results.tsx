"use client";

import { motion, useReducedMotion } from "framer-motion";

import { TranslationCard } from "@/components/commentary/translation-card";
import { TranslationLoadingState } from "@/components/commentary/translation-loading-state";
import { FadeIn } from "@/components/ui/motion";
import type { CommentaryTranslationItem } from "@/types/commentary";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

type CommentaryResultsProps = {
  japaneseText: string;
  translations: CommentaryTranslationItem[];
  isLoading: boolean;
};

export function CommentaryResults({
  japaneseText,
  translations,
  isLoading,
}: CommentaryResultsProps) {
  const hasResults = translations.length > 0;
  const shouldReduceMotion = useReducedMotion();

  const statusMessage = isLoading
    ? "英語実況を生成中です"
    : hasResults
      ? `${translations.length}件の英語実況を表示しました`
      : "";

  return (
    <FadeIn
      className="mx-auto w-full min-w-0 max-w-6xl space-y-4 overflow-x-hidden"
      delay={0.06}
      duration={0.55}
      y={16}
    >
      <header className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          英語実況の変換結果
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          3つの表現を比較して、ニュアンスの違いを学べます
        </p>
      </header>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      {isLoading ? (
        <TranslationLoadingState compact />
      ) : hasResults ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
          {translations.map((translation, index) => (
            <motion.div
              key={`${translation.text}-${index}`}
              className="min-w-0 max-w-full"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: shouldReduceMotion ? 0 : index * 0.07,
                ease: easeOut,
              }}
            >
              <TranslationCard
                translation={translation}
                index={index}
                japaneseText={japaneseText.trim()}
                compact
                denseOnMobile
              />
            </motion.div>
          ))}
        </div>
      ) : null}
    </FadeIn>
  );
}
