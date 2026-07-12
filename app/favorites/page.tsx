"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { FavoriteTranslations } from "@/components/commentary/favorite-translations";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";

export default function FavoritesPage() {
  const favorites = useFavoriteTranslations();
  const hasFavorites = favorites.length > 0;

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <FadeIn>
          <header className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              お気に入り
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              保存した英語実況をいつでも復習できます
            </p>
            {hasFavorites ? (
              <p className="text-xs text-muted-foreground/70">
                保存済み {favorites.length}件　·　最新の保存が先頭
              </p>
            ) : null}
          </header>
        </FadeIn>

        {hasFavorites ? (
          <FavoriteTranslations />
        ) : (
          <FadeIn>
            <div className="flex flex-col items-center gap-3 py-12 text-center sm:py-16">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Star className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  お気に入りはまだありません
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  気になる英語実況の星アイコンを押すと、ここでいつでも復習できます
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-1 rounded-full px-5"
              >
                Homeで英語実況を作る
              </Button>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
