"use client";

import { Star } from "lucide-react";

import { FavoriteTranslations } from "@/components/commentary/favorite-translations";
import { FadeIn } from "@/components/ui/motion";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";

export default function FavoritesPage() {
  const favorites = useFavoriteTranslations();

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {favorites.length === 0 ? (
          <FadeIn>
            <section className="space-y-5">
              <header className="space-y-2">
                <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Star className="size-5" aria-hidden="true" />
                  <h1 className="text-2xl font-bold tracking-tight">お気に入り</h1>
                </div>
                <p className="text-muted-foreground">
                  保存した実況表現を復習できます。
                </p>
              </header>
              <p className="rounded-3xl border border-dashed border-emerald-200/80 bg-card/70 p-8 text-sm leading-relaxed text-muted-foreground shadow-sm dark:border-emerald-800">
                お気に入りはまだありません。Home で変換して ☆ を押すとここに追加されます。
              </p>
            </section>
          </FadeIn>
        ) : (
          <FadeIn>
            <FavoriteTranslations />
          </FadeIn>
        )}
      </main>
    </div>
  );
}
