"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { TranslationCard } from "@/components/commentary/translation-card";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
import { resolveFavoriteLearningPoint } from "@/lib/commentary/learning-point";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export function FavoriteTranslations() {
  const favorites = useFavoriteTranslations();
  const shouldReduceMotion = useReducedMotion();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="お気に入り一覧"
      className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start"
    >
      <AnimatePresence initial={false}>
        {favorites.map((favorite) => {
          const learningPoint = resolveFavoriteLearningPoint(favorite);

          return (
            <motion.div
              key={favorite.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: easeOut }}
              className="min-w-0"
            >
              <TranslationCard
                translation={{
                  text: favorite.text,
                  meaning: favorite.meaning,
                  explanation: favorite.explanation ?? "",
                  learningPoint: learningPoint ?? { text: "", meaning: "" },
                }}
                japaneseText={favorite.japaneseText}
                showIndex={false}
                compact
                showOriginal
                favoriteSurface
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
