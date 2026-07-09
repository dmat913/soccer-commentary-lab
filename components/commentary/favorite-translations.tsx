"use client";

import { Star } from "lucide-react";

import { TranslationCard } from "@/components/commentary/translation-card";
import { FadeIn } from "@/components/ui/motion";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
import { resolveFavoriteLearningPoint } from "@/lib/commentary/learning-point";

export function FavoriteTranslations() {
  const favorites = useFavoriteTranslations();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold tracking-tight">お気に入り</h1>
        </div>
        <p className="text-muted-foreground">
          保存した実況表現を復習できます。
        </p>
      </header>
      <div className="grid gap-5">
        {favorites.map((favorite, index) => {
          const learningPoint = resolveFavoriteLearningPoint(favorite);

          return (
            <FadeIn key={favorite.id} delay={index * 0.05}>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  元の日本語:{" "}
                  <span className="text-foreground">{favorite.japaneseText}</span>
                </p>
                <TranslationCard
                  translation={{
                    text: favorite.text,
                    meaning: favorite.meaning,
                    explanation: favorite.explanation ?? "",
                    learningPoint: learningPoint ?? { text: "", meaning: "" },
                  }}
                  japaneseText={favorite.japaneseText}
                  showIndex={false}
                />
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
