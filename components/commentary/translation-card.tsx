"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { useFavoriteTranslations } from "@/hooks/use-favorite-translations";
import { toggleFavoriteTranslation } from "@/lib/favorites/storage";
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
  const favorites = useFavoriteTranslations();
  const isFavorite = favorites.some(
    (favorite) => favorite.text === translation.text
  );
  const youtubeSearchUrl = getYouTubeSearchUrl(translation.text);

  function handleToggleFavorite() {
    if (!japaneseText) {
      return;
    }

    toggleFavoriteTranslation({
      japaneseText,
      text: translation.text,
      meaning: translation.meaning,
      explanation: translation.explanation,
      learningPoint: translation.learningPoint,
    });
  }

  return (
    <Card className="relative border-emerald-200/70 bg-emerald-50/40 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/30">
      {japaneseText && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
        >
          <Star
            className={cn(
              "size-5",
              isFavorite && "fill-amber-400 text-amber-400"
            )}
          />
        </Button>
      )}

      <CardContent className="min-w-0 space-y-4 pt-6">
        <div className="min-w-0 space-y-1 pr-10">
          {showIndex && (
            <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
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
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              表現の解説
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {translation.explanation}
            </p>
          </div>
        )}

        {translation.learningPoint.text && (
          <div className="min-w-0 space-y-2 rounded-lg border border-emerald-200/60 bg-background/60 p-4 dark:border-emerald-800/40">
            <p className="text-sm font-medium break-words text-emerald-800 dark:text-emerald-300">
              Learning Point（今回覚えたい表現）
            </p>
            <p className="text-lg font-semibold break-words">{translation.learningPoint.text}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {translation.learningPoint.meaning}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          YouTubeで実況を探す
        </Button>
      </CardContent>
    </Card>
  );
}
