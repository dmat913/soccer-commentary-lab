"use client";

import { TranslationCard } from "@/components/commentary/translation-card";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
import { resolveFavoriteLearningPoint } from "@/lib/commentary/learning-point";

export function FavoriteTranslations() {
  const favorites = useFavoriteTranslations();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">お気に入り</h2>
      <div className="grid gap-4">
        {favorites.map((favorite) => {
          const learningPoint = resolveFavoriteLearningPoint(favorite);

          return (
            <div key={favorite.id} className="space-y-2">
              <p className="text-sm text-muted-foreground">
                元の日本語: {favorite.japaneseText}
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
          );
        })}
      </div>
    </section>
  );
}
