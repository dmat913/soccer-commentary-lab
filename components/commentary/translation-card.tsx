"use client";

import { motion } from "framer-motion";
import {
  BookMarked,
  BookmarkCheck,
  Check,
  Clipboard,
  Lightbulb,
  MessageCircle,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverLift } from "@/components/ui/motion";
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
  /** Home result uses a denser layout; Favorites keep the rich default. */
  compact?: boolean;
  /** Favorites: show the original Japanese as an in-card caption above the title. */
  showOriginal?: boolean;
  /** Favorites: slightly stronger surface so cards don't blend into the page. */
  favoriteSurface?: boolean;
  /** Home result: tighten spacing on mobile only (Desktop + Favorites untouched). */
  denseOnMobile?: boolean;
  /** Whether the favorite (star) action is shown. Hidden on the Vocabulary page. */
  showFavoriteAction?: boolean;
  /** Home result: show the "add to vocabulary" action. */
  showVocabularyAction?: boolean;
  /** Home result: whether this expression is already in the vocabulary book. */
  isVocabularySaved?: boolean;
  /** Home result: add this expression to the vocabulary book. */
  onAddVocabulary?: () => void;
  /** Vocabulary page: remove this item from the vocabulary book. */
  onRemoveVocabulary?: () => void;
};

const CANDIDATE_MARKERS = ["①", "②", "③"] as const;

const actionButtonClassName =
  "size-11 min-h-11 min-w-11 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/50";

function getYouTubeSearchUrl(commentaryText: string): string {
  const query = `"${commentaryText}" Premier League commentary`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function TranslationCard({
  translation,
  index = 0,
  japaneseText,
  showIndex = true,
  compact = false,
  showOriginal = false,
  favoriteSurface = false,
  denseOnMobile = false,
  showFavoriteAction = true,
  showVocabularyAction = false,
  isVocabularySaved = false,
  onAddVocabulary,
  onRemoveVocabulary,
}: TranslationCardProps) {
  const { user } = useAuth();
  const favorites = useFavoriteTranslations();
  const isFavorite = favorites.some(
    (favorite) => favorite.text === translation.text
  );
  const youtubeSearchUrl = getYouTubeSearchUrl(translation.text);
  const hasLearningPoint = Boolean(translation.learningPoint.text);
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

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

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(translation.text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = translation.text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const didCopy = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!didCopy) {
          throw new Error("Copy command failed");
        }
      }

      toast.success("Copied!");
      setCopied(true);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 1000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  }

  return (
    <HoverLift className="h-full min-w-0 max-w-full">
      <Card
        className={cn(
          "relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl bg-white/95 dark:bg-emerald-950/35",
          favoriteSurface
            ? "border border-emerald-200/70 shadow-xs transition-[box-shadow,border-color] duration-200 ease-out hover:border-emerald-300/80 hover:shadow-md hover:shadow-emerald-200/40 dark:border-emerald-800/50 dark:shadow-emerald-950/30 dark:hover:border-emerald-700/70 dark:hover:shadow-emerald-900/40"
            : "border border-emerald-100/80 shadow-sm shadow-emerald-100/50 transition-shadow hover:shadow-xl hover:shadow-emerald-200/50 dark:border-emerald-900/50 dark:shadow-emerald-950/40 dark:hover:shadow-emerald-900/50"
        )}
      >
        <CardContent
          className={cn(
            "flex min-w-0 max-w-full flex-1 flex-col",
            compact ? "space-y-3 p-3.5 sm:p-4" : "space-y-6 p-5 sm:p-7",
            denseOnMobile && "max-sm:space-y-2 max-sm:p-3"
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            {showIndex ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 font-semibold text-muted-foreground",
                  compact ? "size-7 text-xs" : "size-8 text-sm",
                  denseOnMobile && "max-sm:size-6 max-sm:text-[11px]"
                )}
                aria-label={`Candidate ${index + 1}`}
              >
                {CANDIDATE_MARKERS[index] ?? String(index + 1)}
              </span>
            ) : (
              <span className="sr-only">Translation</span>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1">
              {japaneseText && showFavoriteAction ? (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    onClick={handleToggleFavorite}
                    aria-label={
                      isFavorite ? "お気に入りを解除" : "お気に入りに追加"
                    }
                    aria-pressed={isFavorite}
                    className={cn(
                      actionButtonClassName,
                      "text-amber-500 hover:text-amber-600"
                    )}
                  >
                    <Star
                      className={cn(
                        "size-6 transition-colors",
                        isFavorite && "fill-amber-400 text-amber-400"
                      )}
                    />
                  </Button>
                </motion.div>
              ) : null}

              {showVocabularyAction ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={onAddVocabulary}
                  disabled={isVocabularySaved}
                  aria-label={
                    isVocabularySaved ? "単語帳に追加済み" : "単語帳に追加"
                  }
                  className={cn(
                    actionButtonClassName,
                    isVocabularySaved
                      ? "text-emerald-600 disabled:opacity-100 dark:text-emerald-400"
                      : "text-foreground/70 hover:text-emerald-800 dark:text-emerald-200 dark:hover:text-emerald-100"
                  )}
                >
                  {isVocabularySaved ? (
                    <BookmarkCheck className="size-5" aria-hidden="true" />
                  ) : (
                    <BookMarked className="size-5" aria-hidden="true" />
                  )}
                </Button>
              ) : null}

              <SpeechPlaybackButton text={translation.text} variant="icon" />

              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => void handleCopy()}
                aria-label={copied ? "コピーしました" : "英語をコピー"}
                className={cn(
                  actionButtonClassName,
                  "text-foreground/70 hover:text-emerald-800 dark:text-emerald-200 dark:hover:text-emerald-100"
                )}
              >
                {copied ? (
                  <Check className="size-5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Clipboard className="size-5" aria-hidden="true" />
                )}
              </Button>

              {onRemoveVocabulary ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={onRemoveVocabulary}
                  aria-label="単語帳から削除"
                  className={cn(
                    actionButtonClassName,
                    "text-foreground/60 hover:bg-red-50 hover:text-red-600 dark:text-emerald-200/70 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  )}
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>

          {showOriginal && japaneseText ? (
            <div className="min-w-0 border-l-2 border-emerald-200/70 pl-2.5 dark:border-emerald-800/60">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                元の日本語
              </p>
              <p className="break-words text-sm leading-snug text-muted-foreground">
                {japaneseText}
              </p>
            </div>
          ) : null}

          <div className="min-w-0 max-w-full">
            <p
              className={cn(
                "font-semibold tracking-tight text-balance break-words text-foreground",
                compact
                  ? "text-lg leading-snug sm:text-xl"
                  : "text-2xl leading-snug sm:text-3xl sm:leading-tight"
              )}
            >
              {translation.text}
            </p>
          </div>

          {translation.meaning ? (
            <div
              className={cn(
                "min-w-0 space-y-0.5 rounded-2xl border border-border/60 bg-gray-50/80 dark:border-border/40 dark:bg-muted/30",
                compact ? "px-3 py-1.5" : "space-y-1 px-4 py-3",
                denseOnMobile && "max-sm:rounded-xl max-sm:px-2.5 max-sm:py-1"
              )}
            >
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                Meaning
              </p>
              <p
                className={cn(
                  "leading-relaxed break-words text-foreground",
                  compact ? "text-sm" : "text-base"
                )}
              >
                {translation.meaning}
              </p>
            </div>
          ) : null}

          {hasLearningPoint ? (
            <div
              className={cn(
                "min-w-0 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-800/45 dark:bg-emerald-950/25",
                compact ? "space-y-1.5 p-2.5" : "space-y-2.5 p-4",
                denseOnMobile && "max-sm:space-y-1 max-sm:rounded-xl max-sm:p-2"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-emerald-500/90 dark:text-emerald-950 sm:px-2.5">
                  <Lightbulb className="size-3" aria-hidden="true" />
                  Learning Point
                </span>
              </div>
              <div
                className={cn(
                  "min-w-0 space-y-1",
                  denseOnMobile && "max-sm:space-y-0.5"
                )}
              >
                <p
                  className={cn(
                    "font-semibold tracking-wide break-words text-emerald-950 dark:text-emerald-50",
                    compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
                  )}
                >
                  {translation.learningPoint.text}
                </p>
                {translation.learningPoint.meaning ? (
                  <p
                    className={cn(
                      "leading-relaxed break-words text-emerald-900/80 dark:text-emerald-200/80",
                      compact ? "text-xs" : "text-sm"
                    )}
                  >
                    {translation.learningPoint.meaning}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {translation.explanation ? (
            <div
              className={cn(
                "min-w-0 space-y-1 px-0.5",
                denseOnMobile && "max-sm:space-y-0.5"
              )}
            >
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 font-semibold text-foreground",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                <MessageCircle
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                Explanation
              </p>
              <p
                className={cn(
                  "break-words text-muted-foreground",
                  compact
                    ? "line-clamp-3 text-xs leading-5"
                    : "text-sm leading-7"
                )}
              >
                {translation.explanation}
              </p>
            </div>
          ) : null}

          <div
            className={cn(
              "mt-auto min-w-0",
              compact ? "space-y-1.5 pt-1" : "space-y-2",
              denseOnMobile && "max-sm:space-y-1 max-sm:pt-0"
            )}
          >
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              Practice
            </p>
            <Button
              variant="outline"
              className={cn(
                "w-full max-w-full rounded-xl border-border bg-white transition-colors duration-200 ease-out hover:border-emerald-300/70 hover:bg-emerald-50/40 dark:bg-background dark:hover:border-emerald-700/60 dark:hover:bg-emerald-950/30",
                compact ? "h-9 gap-1.5 px-2 text-xs sm:text-sm" : "h-11"
              )}
              nativeButton={false}
              render={
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="この表現を実況動画で練習する"
                  aria-label="この表現をYouTubeの実況で練習する"
                />
              }
            >
              <Play
                className="size-3.5 shrink-0 fill-red-600 text-red-600 sm:size-4"
                aria-hidden="true"
              />
              <span className="truncate">この表現を練習</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </HoverLift>
  );
}
