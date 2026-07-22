"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BookMarked, Check, Ear, MoreHorizontal } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";

import { SpeechPlaybackButton } from "@/components/commentary/speech-playback-button";
import { ActionSpinner } from "@/components/ui/action-spinner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatHeardCount } from "@/lib/discover/supabase-mapping";
import {
  discoverCategoryBadgeClassName,
  discoverCategoryLabel,
} from "@/lib/discover/category";
import { cn } from "@/lib/utils";
import type { DiscoverPost } from "@/types/discover";

function formatCompactDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

type DiscoverFeedCardProps = {
  post: DiscoverPost;
  isHeard: boolean;
  isHeardUpdating: boolean;
  onToggleHeard: (postId: string) => void;
  isVocabularySaved: boolean;
  isVocabularyUpdating: boolean;
  isAuthenticated: boolean;
  onAddToVocabulary: (post: DiscoverPost) => void;
  /** True only for the signed-in author's own posts. */
  isOwnedByViewer?: boolean;
  isUnpublishPending?: boolean;
  onUnpublish?: (post: DiscoverPost) => Promise<void>;
  /** Soft highlight when opened via /discover?post= */
  highlighted?: boolean;
};

export const DiscoverFeedCard = memo(function DiscoverFeedCard({
  post,
  isHeard,
  isHeardUpdating,
  onToggleHeard,
  isVocabularySaved,
  isVocabularyUpdating,
  isAuthenticated,
  onAddToVocabulary,
  isOwnedByViewer = false,
  isUnpublishPending = false,
  onUnpublish,
  highlighted = false,
}: DiscoverFeedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const formattedCount = formatHeardCount(post.heardCount);
  const meaning = post.meaning?.trim() ?? "";
  const heardLabel = isHeard
    ? `聞いたことある ✓。${formattedCount}人が聞いたことある。反応を取り消す`
    : `${formattedCount}人が聞いたことある。この実況表現を実際に聞いたことがあるとして反応する`;

  const vocabularyLabel = isVocabularyUpdating
    ? "追加中…"
    : isVocabularySaved
      ? "追加済み ✓"
      : "単語帳に追加";

  async function confirmUnpublishAction() {
    if (!onUnpublish) {
      return;
    }

    try {
      await onUnpublish(post);
      // Success is visible via optimistic card removal — no success toast.
      setConfirmUnpublish(false);
    } catch {
      toast.error("削除できませんでした");
    }
  }

  return (
    <article
      id={`discover-post-${post.id}`}
      data-discover-post-id={post.id}
      className={cn(
        "rounded-xl border border-border/70 bg-card shadow-xs transition-[box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none",
        "scroll-mt-24 scroll-mb-28 px-3 py-2.5 sm:px-3.5 sm:py-3 md:scroll-mb-8",
        "hover:border-border hover:shadow-sm",
        highlighted && "border-primary ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <Badge
            variant="outline"
            className={cn(
              discoverCategoryBadgeClassName(post.category),
              "h-5 rounded-md px-1.5 text-[10px] font-medium"
            )}
          >
            {discoverCategoryLabel(post.category)}
          </Badge>
          <time
            dateTime={post.createdAt}
            className="shrink-0 text-[10px] leading-none text-muted-foreground tabular-nums"
          >
            {formatCompactDate(post.createdAt)}
          </time>
        </div>

        {isOwnedByViewer && onUnpublish ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              disabled={isUnpublishPending}
              aria-label="Discover投稿の操作"
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={6}
              className="z-[60] min-w-40 w-auto max-w-[calc(100vw-1.5rem)]"
            >
              <DropdownMenuItem
                variant="destructive"
                disabled={isUnpublishPending}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmUnpublish(true);
                }}
              >
                公開を取り消す
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="mt-1.5 min-w-0 space-y-0.5">
        <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-balance break-words text-foreground sm:text-base">
          {post.englishText}
        </h2>
        {post.japaneseText.trim() ? (
          <p className="break-words text-[12px] leading-snug text-muted-foreground sm:text-[13px]">
            {post.japaneseText}
          </p>
        ) : null}
      </div>

      {meaning ? (
        <p className="mt-1.5 line-clamp-2 break-words text-[11px] leading-snug text-muted-foreground sm:text-xs">
          <span className="mr-1.5 font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Meaning
          </span>
          <span className="text-foreground/75">{meaning}</span>
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <button
          type="button"
          aria-pressed={isHeard}
          aria-label={isHeardUpdating ? "更新中…" : heardLabel}
          aria-busy={isHeardUpdating}
          disabled={isHeardUpdating}
          onClick={() => onToggleHeard(post.id)}
          className={cn(
            "inline-flex min-h-9 min-w-0 max-w-full items-center gap-1 rounded-full border px-2 py-1 text-left text-[11px] font-medium tabular-nums transition-colors sm:gap-1.5 sm:px-2.5 sm:text-[12px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-70",
            isHeard
              ? "border-primary/35 bg-primary/[0.08] text-primary"
              : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {isHeardUpdating ? (
            <ActionSpinner className="size-3.5" />
          ) : isHeard ? (
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Ear className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="min-w-0 leading-none">
            <span className="sm:hidden">{formattedCount}人</span>
            <span className="hidden sm:inline">
              {isHeardUpdating
                ? "更新中…"
                : isHeard
                  ? "聞いたことある ✓"
                  : "聞いたことある"}
              <span className="text-current/70"> · {formattedCount}人</span>
            </span>
          </span>
        </button>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1">
          <SpeechPlaybackButton
            text={post.englishText}
            variant="icon"
            className="size-9 min-h-9 min-w-9 rounded-full text-foreground/65 hover:bg-muted hover:text-foreground [&_svg]:size-4"
          />
          <Button
            type="button"
            variant={isVocabularySaved ? "outline" : "default"}
            aria-label={vocabularyLabel}
            aria-pressed={isVocabularySaved}
            aria-busy={isVocabularyUpdating}
            disabled={isVocabularyUpdating || isVocabularySaved}
            title={
              !isAuthenticated && !isVocabularySaved
                ? "未ログインでの追加は、この端末に保存されます。"
                : undefined
            }
            onClick={() => onAddToVocabulary(post)}
            className={cn(
              "h-9 min-h-9 min-w-[7.25rem] max-w-full rounded-full px-2.5 text-[11px] font-semibold sm:px-3 sm:text-xs",
              "disabled:cursor-not-allowed",
              isVocabularySaved &&
                "border-emerald-200/80 bg-emerald-50/70 text-emerald-800 disabled:opacity-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            )}
          >
            {isVocabularyUpdating ? (
              <ActionSpinner className="size-3.5" />
            ) : isVocabularySaved ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <BookMarked className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">
              {isVocabularyUpdating
                ? "追加中…"
                : isVocabularySaved
                  ? "追加済み ✓"
                  : "単語帳に追加"}
            </span>
          </Button>
        </div>
      </div>

      <Dialog.Root
        open={confirmUnpublish}
        onOpenChange={(open) => {
          if (!open && !isUnpublishPending) {
            setConfirmUnpublish(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-closed:opacity-0 data-open:opacity-100" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl outline-none">
              <Dialog.Title className="text-base font-semibold text-foreground">
                公開を取り消しますか？
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Discoverから投稿を削除します。お気に入り自体は削除されません。
              </Dialog.Description>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close
                  disabled={isUnpublishPending}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "min-h-11 w-full disabled:cursor-not-allowed sm:w-auto"
                  )}
                >
                  キャンセル
                </Dialog.Close>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isUnpublishPending}
                  aria-busy={isUnpublishPending}
                  aria-label={
                    isUnpublishPending ? "取り消し中…" : "公開を取り消す"
                  }
                  onClick={() => void confirmUnpublishAction()}
                  className="min-h-11 w-full min-w-[6.5rem] disabled:cursor-not-allowed sm:w-auto"
                >
                  {isUnpublishPending ? (
                    <ActionSpinner className="size-3.5" />
                  ) : null}
                  {isUnpublishPending ? "取り消し中…" : "公開を取り消す"}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
});
