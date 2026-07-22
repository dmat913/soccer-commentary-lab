"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { TranslationCard } from "@/components/commentary/translation-card";
import { TranslationLoadingState } from "@/components/commentary/translation-loading-state";
import { FadeIn } from "@/components/ui/fade-in";
import { useVocabulary } from "@/hooks/use-vocabulary";
import { sectionTitleClassName } from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";
import type { CommentaryTranslationItem } from "@/types/commentary";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

/** Brief pause after loading so results feel “generated”, not abrupt. */
const REVEAL_HOLD_MS = 100;
/** Stagger between cards (~80ms). Three starts land within ~160ms. */
const CARD_STAGGER_S = 0.08;
const CARD_DURATION_S = 0.18;

type CommentaryResultsProps = {
  japaneseText: string;
  translations: CommentaryTranslationItem[];
  isLoading: boolean;
};

function isResultsSectionOffScreen(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.bottom < 64 || rect.top > window.innerHeight * 0.45;
}

function scrollResultsIntoViewIfNeeded(
  preferReducedMotion: boolean | null
) {
  const element = document.getElementById("commentary-results");
  if (!element || !isResultsSectionOffScreen(element)) {
    return;
  }

  element.scrollIntoView({
    behavior: preferReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function CommentaryResults({
  japaneseText,
  translations,
  isLoading,
}: CommentaryResultsProps) {
  const hasResults = translations.length > 0;
  const shouldReduceMotion = useReducedMotion();
  const { addVocabularyItem, isVocabularyItemSaved } = useVocabulary();

  const [cardsReady, setCardsReady] = useState(
    () => !isLoading && translations.length > 0
  );
  const [wasLoading, setWasLoading] = useState(isLoading);
  const [pendingReveal, setPendingReveal] = useState(false);

  // Sync loading phase during render (avoids setState-in-effect).
  if (isLoading !== wasLoading) {
    setWasLoading(isLoading);
    if (isLoading) {
      setPendingReveal(true);
      setCardsReady(false);
    }
  }

  // History restore / already-present results: reveal immediately.
  if (!isLoading && hasResults && !cardsReady && !pendingReveal) {
    setCardsReady(true);
  }

  useEffect(() => {
    if (isLoading || !hasResults || cardsReady || !pendingReveal) {
      return;
    }

    const holdMs = shouldReduceMotion ? 0 : REVEAL_HOLD_MS;
    const timer = window.setTimeout(() => {
      setPendingReveal(false);
      setCardsReady(true);
      scrollResultsIntoViewIfNeeded(shouldReduceMotion);
    }, holdMs);

    return () => window.clearTimeout(timer);
  }, [isLoading, hasResults, cardsReady, pendingReveal, shouldReduceMotion]);

  const statusMessage = isLoading
    ? "英語実況を生成中…"
    : cardsReady && hasResults
      ? `${translations.length}件の英語実況を表示しました`
      : hasResults
        ? "英語実況の候補を準備しています"
        : "";

  const showLoading = isLoading || (hasResults && !cardsReady);

  if (!isLoading && !hasResults) {
    return null;
  }

  return (
    <FadeIn
      className="mx-auto w-full min-w-0 max-w-6xl space-y-3 overflow-x-hidden scroll-mt-20 sm:space-y-4"
      delay={0.06}
      duration={0.45}
      y={12}
    >
      <div className="space-y-3 sm:space-y-4">
        <header className="space-y-1 text-left">
          <h2 className={cn(sectionTitleClassName)}>英語実況の候補</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ニュアンスの異なる3つの表現を比べてみましょう
          </p>
        </header>

        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </p>

        <AnimatePresence initial={false}>
          {showLoading ? (
            <motion.div
              key="loading"
              initial={shouldReduceMotion ? false : { opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : {
                      opacity: 0,
                      transition: { duration: 0.14, ease: easeOut },
                    }
              }
            >
              <TranslationLoadingState compact />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3 lg:items-start"
              initial={shouldReduceMotion ? false : { opacity: 0.01 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.08,
                ease: easeOut,
              }}
            >
              {translations.map((translation, index) => (
                <motion.div
                  key={`${translation.text}-${index}`}
                  className="min-w-0 max-w-full"
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 10, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : CARD_DURATION_S,
                    delay: shouldReduceMotion ? 0 : index * CARD_STAGGER_S,
                    ease: easeOut,
                  }}
                >
                  <TranslationCard
                    translation={translation}
                    index={index}
                    japaneseText={japaneseText.trim()}
                    compact
                    denseOnMobile
                    homeResults
                    showVocabularyAction
                    isVocabularySaved={isVocabularyItemSaved(translation.text)}
                    onAddVocabulary={() =>
                      addVocabularyItem({
                        englishText: translation.text,
                        meaning: translation.meaning,
                        japaneseText: japaneseText.trim(),
                        ...(translation.learningPoint.text
                          ? { learningPoint: translation.learningPoint }
                          : {}),
                      })
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
