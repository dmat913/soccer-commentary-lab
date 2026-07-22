"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { FavoriteTranslations } from "@/components/commentary/favorite-translations";
import { TranslationCardSkeleton } from "@/components/commentary/translation-card-skeleton";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import {
  useFavoriteTranslations,
  useFavoriteTranslationsLoading,
} from "@/hooks/use-favorite-translations";
import {
  emptyStateIconClassName,
  pageHeaderClassName,
  pageMainClassName,
  pageShellClassName,
  pageSubtitleClassName,
  pageTitleClassName,
} from "@/lib/design/surfaces";

function FavoritesListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid min-w-0 grid-cols-1 items-start gap-2.5 sm:gap-3 lg:grid-cols-2"
    >
      <span className="sr-only">お気に入りを読み込み中</span>
      {[0, 1].map((index) => (
        <div key={index} aria-hidden="true" className="min-w-0">
          <TranslationCardSkeleton index={index} compact />
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const favorites = useFavoriteTranslations();
  const isLoading = useFavoriteTranslationsLoading();
  const hasFavorites = favorites.length > 0;

  return (
    <div className={pageShellClassName}>
      <main className={`${pageMainClassName} gap-4 sm:gap-6`}>
        <FadeIn>
          <header className={pageHeaderClassName}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h1 className={pageTitleClassName}>お気に入り</h1>
              {hasFavorites ? (
                <p className="text-caption text-muted-foreground">
                  {favorites.length}件の表現
                </p>
              ) : null}
            </div>
            <p className={pageSubtitleClassName}>
              気に入った実況表現を保存して、いつでも聞き直せます
            </p>
          </header>
        </FadeIn>

        {hasFavorites ? (
          <FavoriteTranslations />
        ) : isLoading ? (
          <FavoritesListSkeleton />
        ) : (
          <FadeIn>
            <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
              <div className={emptyStateIconClassName}>
                <Star className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  お気に入りはまだありません
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  気に入った実況表現の星を押すと、ここに保存されます
                </p>
              </div>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-1 rounded-full px-5"
              >
                実況を作る
              </Button>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
