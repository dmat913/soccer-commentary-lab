"use client";

import { Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverLift } from "@/components/ui/motion";
import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { useAuth } from "@/hooks/use-auth";
import {
  toggleFavorite,
  useFavoriteTranslations,
} from "@/hooks/use-favorite-translations";
import { cn } from "@/lib/utils";
import type { CommentaryTranslationItem } from "@/types/commentary";

type TranslationCardProps = {
  translation: CommentaryTranslationItem;
  index?: number;
  japaneseText?: string;
  showIndex?: boolean;
};

function getYouTubeSearchUrl(commentaryText: string): string {
  const query = `"${commentaryText}" Premier League commentary`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function TranslationCard({
  translation,
  index = 0,
  japaneseText,
  showIndex = true,
}: TranslationCardProps) {
  const { user } = useAuth();
  const favorites = useFavoriteTranslations();
  const isFavorite = favorites.some(
    (favorite) => favorite.text === translation.text
  );
  const youtubeSearchUrl = getYouTubeSearchUrl(translation.text);

  function handleToggleFavorite() {
    if (!japaneseText) {
      return;
    }

    toggleFavorite(
      {
        japaneseText,
        text: translation.text,
        meaning: translation.meaning,
        explanation: translation.explanation,
        learningPoint: translation.learningPoint,
      },
      user?.id
    );
  }

  return (
    <HoverLift>
      <Card className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-white/80 shadow-md shadow-emerald-100/40 transition-shadow hover:shadow-lg hover:shadow-emerald-200/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:shadow-emerald-950/30 dark:hover:shadow-emerald-900/40">
        {japaneseText && (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            aria-pressed={isFavorite}
            className="absolute top-3 right-3 z-10 size-11 text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
          >
            <Star
              className={cn(
                "size-6",
                isFavorite && "fill-amber-400 text-amber-400"
              )}
            />
          </Button>
        )}

        <CardContent className="min-w-0 space-y-5 pt-7">
          <div className="min-w-0 space-y-2 pr-12">
            {showIndex && (
              <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                表現 {index + 1}
              </p>
            )}
            <p className="text-xl leading-snug font-semibold tracking-tight break-words sm:text-2xl">
              {translation.text}
            </p>
            <SpeechPlaybackButton text={translation.text} />
          </div>

          <p className="text-base leading-relaxed text-muted-foreground">
            {translation.meaning}
          </p>

          {translation.explanation && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                表現の解説
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {translation.explanation}
              </p>
            </div>
          )}

          {translation.learningPoint.text && (
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:bg-emerald-900/60 dark:text-emerald-200">
                Learning Point
              </span>
              <div className="space-y-1">
                <p className="text-lg font-semibold break-words">
                  {translation.learningPoint.text}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {translation.learningPoint.meaning}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full rounded-xl border-emerald-200/80 hover:bg-emerald-50/80 dark:border-emerald-800 dark:hover:bg-emerald-950/40"
            nativeButton={false}
            render={
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Play className="size-4 fill-red-600 text-red-600" aria-hidden="true" />
            YouTubeで実況を探す
          </Button>
        </CardContent>
      </Card>
    </HoverLift>
  );
}
