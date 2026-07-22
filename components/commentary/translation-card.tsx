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
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import {
  microLabelClassName,
  surfaceCardClassName,
  surfaceCardEmphasisClassName,
} from "@/lib/design/surfaces";
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
  /**
   * Home conversion results: candidate 01/02/03, original JP, collapsible
   * explanation, Vocabulary as primary learning CTA, no card hover lift.
   * Favorites leave this unset.
   */
  homeResults?: boolean;
  /** Optional footer rendered below Practice (e.g. Discover publish on Favorites). */
  footer?: ReactNode;
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
  /**
   * Favorites: when set and currently favorited, called instead of immediate
   * unfavorite (e.g. confirm that Discover publish continues).
   */
  onRequestUnfavorite?: () => void;
};

const CANDIDATE_MARKERS = ["①", "②", "③"] as const;

const actionButtonClassName =
  "size-11 min-h-11 min-w-11 rounded-full hover:bg-muted";

const favoriteActionButtonClassName =
  "size-9 min-h-9 min-w-9 rounded-full hover:bg-muted";

function getYouTubeSearchUrl(commentaryText: string): string {
  const query = `"${commentaryText}" Premier League commentary`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function formatCandidateIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function CollapsibleExplanation({
  explanation,
  compact,
  denseOnMobile,
  lineClampClass = "line-clamp-3 sm:line-clamp-4",
}: {
  explanation: string;
  compact: boolean;
  denseOnMobile: boolean;
  lineClampClass?: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      return;
    }

    if (expanded) {
      return;
    }

    // line-clamp can make scrollHeight === clientHeight in some engines;
    // fall back to a length heuristic so long Favorites/Home copy stays expandable.
    const overflows = el.scrollHeight > el.clientHeight + 1;
    const threshold = lineClampClass.includes("line-clamp-2") ? 64 : 96;
    const likelyLong = explanation.trim().length > threshold;
    setCanExpand(overflows || likelyLong);
  }, [explanation, expanded, lineClampClass]);

  return (
    <div
      className={cn(
        "min-w-0 px-0.5",
        compact ? "space-y-0.5" : "space-y-1",
        denseOnMobile && "max-sm:space-y-0.5"
      )}
    >
      <p
        className={cn(
          "inline-flex items-center gap-1 font-medium text-muted-foreground",
          compact ? "text-[11px] leading-none" : "text-sm"
        )}
      >
        <MessageCircle
          className={cn(
            "shrink-0 text-muted-foreground",
            compact ? "size-3" : "size-3.5"
          )}
          aria-hidden="true"
        />
        解説
      </p>
      <p
        ref={textRef}
        className={cn(
          "break-words text-muted-foreground",
          compact ? "text-xs leading-5" : "text-sm leading-7",
          !expanded && lineClampClass
        )}
      >
        {explanation}
      </p>
      {canExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={cn(
            "rounded-md px-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            compact ? "min-h-8 py-0.5" : "min-h-9"
          )}
        >
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      ) : null}
    </div>
  );
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
  homeResults = false,
  footer,
  showFavoriteAction = true,
  showVocabularyAction = false,
  isVocabularySaved = false,
  onAddVocabulary,
  onRemoveVocabulary,
  onRequestUnfavorite,
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
  const vocabularyInHeader = showVocabularyAction && !homeResults;

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

    if (isFavorite && onRequestUnfavorite) {
      onRequestUnfavorite();
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

      toast.success("コピーしました");
      setCopied(true);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 1500);
    } catch {
      toast.error("コピーに失敗しました");
    }
  }

  const card = (
    <Card
      className={cn(
        "relative flex min-w-0 max-w-full flex-col overflow-hidden",
        homeResults || favoriteSurface
          ? surfaceCardClassName
          : surfaceCardEmphasisClassName,
        favoriteSurface || homeResults ? "h-auto" : "h-full"
      )}
    >
      <CardContent
        className={cn(
          "flex min-w-0 max-w-full flex-col",
          homeResults || favoriteSurface ? "flex-none" : "flex-1",
          favoriteSurface
            ? "space-y-2 p-2.5 max-sm:space-y-1.5 sm:p-3"
            : compact
              ? "space-y-3 p-3.5 sm:p-4"
              : "space-y-6 p-5 sm:p-7",
          denseOnMobile && !favoriteSurface && "max-sm:space-y-2.5 max-sm:p-3"
        )}
      >
        {favoriteSurface ? (
          <div className="relative min-w-0 pr-[6.75rem]">
            <h3 className="min-w-0 text-base font-semibold leading-snug tracking-tight text-balance break-words text-foreground sm:text-lg">
              {translation.text}
            </h3>
            <div className="absolute top-0 right-0 flex shrink-0 items-center gap-0.5">
              {japaneseText && showFavoriteAction ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  aria-label={
                    isFavorite ? "お気に入りから削除" : "お気に入りに追加"
                  }
                  aria-pressed={isFavorite}
                  className={cn(
                    favoriteActionButtonClassName,
                    "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40",
                    isFavorite && "bg-amber-50/90 dark:bg-amber-950/30"
                  )}
                >
                  <Star
                    className={cn(
                      "size-4 transition-colors",
                      isFavorite
                        ? "fill-amber-200 text-amber-600 dark:fill-amber-700/80 dark:text-amber-300"
                        : "text-amber-500"
                    )}
                  />
                </Button>
              ) : null}
              <SpeechPlaybackButton
                text={translation.text}
                variant="icon"
                className="size-9 min-h-9 min-w-9 [&_svg]:size-4"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleCopy()}
                aria-label={copied ? "コピーしました" : "英語をコピー"}
                className={cn(
                  favoriteActionButtonClassName,
                  "text-foreground/65 hover:text-foreground"
                )}
              >
                {copied ? (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <Clipboard className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-2">
            {showIndex ? (
              homeResults ? (
                <span
                  className="inline-flex shrink-0 items-center rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground tabular-nums"
                  aria-label={`候補 ${index + 1}`}
                >
                  {formatCandidateIndex(index)}
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 font-semibold text-muted-foreground",
                    compact ? "size-7 text-xs" : "size-8 text-sm",
                    denseOnMobile && "max-sm:size-6 max-sm:text-[11px]"
                  )}
                  aria-label={`候補 ${index + 1}`}
                >
                  {CANDIDATE_MARKERS[index] ?? String(index + 1)}
                </span>
              )
            ) : (
              <span className="sr-only">翻訳候補</span>
            )}

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
              {japaneseText && showFavoriteAction ? (
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    onClick={handleToggleFavorite}
                    aria-label={
                      isFavorite ? "お気に入りから削除" : "お気に入りに追加"
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

              {vocabularyInHeader ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={onAddVocabulary}
                  disabled={isVocabularySaved}
                  aria-label={
                    isVocabularySaved ? "追加済み ✓" : "単語帳に追加"
                  }
                  aria-pressed={isVocabularySaved}
                  className={cn(
                    actionButtonClassName,
                    isVocabularySaved
                      ? "text-primary disabled:cursor-default disabled:opacity-100"
                      : "text-foreground/70 hover:text-primary"
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
                  "text-foreground/70 hover:text-foreground"
                )}
              >
                {copied ? (
                  <Check className="size-5 text-primary" aria-hidden="true" />
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
                    "text-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                  )}
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {!favoriteSurface ? (
          <div className="min-w-0 max-w-full space-y-1.5">
            <p
              className={cn(
                "font-semibold tracking-tight text-balance break-words text-foreground",
                compact
                  ? "text-lg leading-snug sm:text-xl"
                  : "text-2xl leading-snug sm:text-3xl sm:leading-tight",
                homeResults && "text-[1.125rem] leading-snug sm:text-xl"
              )}
            >
              {translation.text}
            </p>
            {homeResults && japaneseText ? (
              <div className="min-w-0">
                <p className={microLabelClassName}>元の日本語</p>
                <p className="break-words text-sm leading-snug text-muted-foreground">
                  {japaneseText}
                </p>
              </div>
            ) : null}
          </div>
        ) : (showOriginal || favoriteSurface) && japaneseText ? (
          <div className="min-w-0 space-y-0">
            {favoriteSurface ? (
              <p className="break-words text-xs leading-snug text-muted-foreground">
                <span className="font-medium text-muted-foreground/80">
                  元の日本語
                </span>
                <span aria-hidden="true"> · </span>
                {japaneseText}
              </p>
            ) : (
              <>
                <p className={microLabelClassName}>元の日本語</p>
                <p className="break-words text-sm leading-snug text-muted-foreground">
                  {japaneseText}
                </p>
              </>
            )}
          </div>
        ) : null}

        {translation.meaning ? (
          <div
            className={cn(
              "min-w-0 rounded-xl border",
              favoriteSurface
                ? "space-y-0 rounded-lg border-slate-200/80 bg-slate-50 px-2 py-1 dark:border-border/60 dark:bg-muted/30"
                : "space-y-0.5 border-border/70 bg-muted/40",
              !favoriteSurface &&
                (compact ? "px-2.5 py-1.5" : "space-y-1 px-4 py-3"),
              denseOnMobile &&
                !favoriteSurface &&
                "max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1"
            )}
          >
            <p
              className={cn(
                microLabelClassName,
                favoriteSurface && "text-[10px] leading-none text-slate-500 dark:text-muted-foreground"
              )}
            >
              Meaning
            </p>
            <p
              className={cn(
                "break-words text-foreground",
                favoriteSurface
                  ? "text-xs leading-snug text-slate-700 dark:text-foreground"
                  : compact
                    ? "text-sm leading-relaxed"
                    : "text-base leading-relaxed"
              )}
            >
              {translation.meaning}
            </p>
          </div>
        ) : null}

        {hasLearningPoint ? (
          <div
            className={cn(
              "min-w-0 rounded-xl border",
              homeResults
                ? "border-border/80 bg-background"
                : favoriteSurface
                  ? "space-y-0.5 rounded-lg border-primary/20 bg-primary/[0.04] p-2"
                  : "rounded-2xl border-primary/20 bg-primary/[0.06] dark:border-primary/30 dark:bg-primary/10",
              !favoriteSurface &&
                (compact ? "space-y-1 p-2.5" : "space-y-2.5 p-4"),
              denseOnMobile &&
                !favoriteSurface &&
                "max-sm:space-y-1 max-sm:rounded-lg max-sm:p-2"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase sm:px-2.5",
                  homeResults
                    ? "border-border/80 bg-muted/50 text-muted-foreground"
                    : "border-primary/25 bg-primary/[0.08] text-primary",
                  favoriteSurface && "gap-1 px-1.5 py-px"
                )}
              >
                <Lightbulb
                  className={cn(
                    "size-3",
                    homeResults && "text-primary",
                    favoriteSurface && "size-2.5"
                  )}
                  aria-hidden="true"
                />
                Learning Point
              </span>
            </div>
            <div
              className={cn(
                "min-w-0",
                favoriteSurface
                  ? translation.learningPoint.meaning
                    ? "space-y-0.5"
                    : "space-y-0"
                  : "space-y-1",
                denseOnMobile && !favoriteSurface && "max-sm:space-y-0.5"
              )}
            >
              <p
                className={cn(
                  "font-semibold tracking-wide break-words text-foreground",
                  favoriteSurface
                    ? "text-sm leading-snug"
                    : compact
                      ? "text-sm"
                      : "text-lg sm:text-xl"
                )}
              >
                {translation.learningPoint.text}
              </p>
              {translation.learningPoint.meaning ? (
                <p
                  className={cn(
                    "leading-snug break-words text-muted-foreground",
                    favoriteSurface || compact ? "text-xs" : "text-sm leading-relaxed"
                  )}
                >
                  {translation.learningPoint.meaning}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {translation.explanation ? (
          homeResults || favoriteSurface ? (
            <CollapsibleExplanation
              explanation={translation.explanation}
              compact={compact || favoriteSurface}
              denseOnMobile={denseOnMobile || favoriteSurface}
              lineClampClass={
                favoriteSurface
                  ? "line-clamp-2"
                  : "line-clamp-3 sm:line-clamp-4"
              }
            />
          ) : (
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
                解説
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
          )
        ) : null}

        <div
          className={cn(
            "min-w-0 space-y-2",
            !favoriteSurface && !homeResults && "mt-auto",
            compact || favoriteSurface ? "pt-0.5" : "pt-0",
            denseOnMobile && "max-sm:space-y-1.5 max-sm:pt-0"
          )}
        >
          {homeResults && showVocabularyAction ? (
            <Button
              type="button"
              variant={isVocabularySaved ? "outline" : "default"}
              disabled={isVocabularySaved}
              onClick={onAddVocabulary}
              aria-label={
                isVocabularySaved ? "追加済み ✓" : "単語帳に追加"
              }
              aria-pressed={isVocabularySaved}
              className={cn(
                "h-11 w-full max-w-full gap-1.5 rounded-xl text-sm font-semibold",
                isVocabularySaved &&
                  "border-emerald-200/80 bg-emerald-50/70 text-emerald-800 disabled:cursor-default disabled:opacity-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              )}
            >
              {isVocabularySaved ? (
                <BookmarkCheck className="size-4" aria-hidden="true" />
              ) : (
                <BookMarked className="size-4" aria-hidden="true" />
              )}
              <span className="truncate">
                {isVocabularySaved ? "追加済み ✓" : "単語帳に追加"}
              </span>
            </Button>
          ) : null}

          <div className={cn("min-w-0", !favoriteSurface && (compact ? "space-y-1.5" : "space-y-2"))}>
            {favoriteSurface ? null : (
              <p className={microLabelClassName}>練習</p>
            )}
            <Button
              variant="outline"
              className={cn(
                "w-full max-w-full rounded-xl",
                favoriteSurface
                  ? "h-9 min-h-9 gap-1.5 border-border/70 px-2 text-xs font-medium text-foreground/90 hover:bg-muted/60"
                  : compact
                    ? "h-10 gap-1.5 px-2 text-xs sm:text-sm"
                    : "h-11"
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
                className={cn(
                  "size-3.5 shrink-0 sm:size-4",
                  favoriteSurface
                    ? "fill-foreground/55 text-foreground/70"
                    : "fill-red-600 text-red-600"
                )}
                aria-hidden="true"
              />
              <span className="truncate">この表現を練習</span>
            </Button>
          </div>
        </div>

        {footer ? (
          <div
            className={cn(
              "min-w-0 border-t",
              favoriteSurface
                ? "border-border/40 pt-1.5"
                : "border-border/50 pt-2.5"
            )}
          >
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (homeResults || favoriteSurface) {
    return <div className="min-w-0 max-w-full">{card}</div>;
  }

  return (
    <HoverLift className="min-w-0 max-w-full h-full">{card}</HoverLift>
  );
}
