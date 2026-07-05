"use client";

import { FavoriteTranslations } from "@/components/commentary/favorite-translations";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";

export default function FavoritesPage() {
  const favorites = useFavoriteTranslations();

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/25">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {favorites.length === 0 ? (
          <section className="space-y-4">
            <header className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">お気に入り</h1>
              <p className="text-muted-foreground">
                保存した実況表現を復習できます。
              </p>
            </header>
            <p className="rounded-2xl border border-dashed border-emerald-200 bg-card/60 p-6 text-sm leading-relaxed text-muted-foreground dark:border-emerald-800">
              お気に入りはまだありません。Home で変換して ☆ を押すとここに追加されます。
            </p>
          </section>
        ) : (
          <FavoriteTranslations />
        )}
      </main>
    </div>
  );
}
