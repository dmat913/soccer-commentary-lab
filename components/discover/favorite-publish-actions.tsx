"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { Check, Globe2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LoginButton } from "@/components/auth/login-button";
import { ActionSpinner } from "@/components/ui/action-spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDiscoverPublishUnavailableReason } from "@/lib/favorites/supabase-mapping";
import { cn } from "@/lib/utils";
import type {
  DiscoverPublishedPost,
  DiscoverPublishResult,
} from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";

type ConfirmationMode = "publish" | "unpublish" | null;

type FavoritePublishActionsProps = {
  favorite: FavoriteTranslation;
  userId: string | null;
  publishedPost?: DiscoverPublishedPost;
  loading: boolean;
  pending: boolean;
  onPublish: (
    favorite: FavoriteTranslation
  ) => Promise<DiscoverPublishResult>;
  onUnpublish: (post: DiscoverPublishedPost) => Promise<void>;
};

export function FavoritePublishActions({
  favorite,
  userId,
  publishedPost,
  loading,
  pending,
  onPublish,
  onUnpublish,
}: FavoritePublishActionsProps) {
  const [confirmationMode, setConfirmationMode] =
    useState<ConfirmationMode>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const unavailableReason = getDiscoverPublishUnavailableReason(favorite);

  async function confirmAction() {
    if (confirmationMode === "publish") {
      try {
        await onPublish(favorite);
        // Success is visible via the 「公開中」 badge — no success toast.
        setConfirmationMode(null);
      } catch {
        toast.error("公開できませんでした");
      }
      return;
    }

    if (confirmationMode === "unpublish" && publishedPost) {
      try {
        await onUnpublish(publishedPost);
        // Success is visible via returning to the publish CTA — no success toast.
        setConfirmationMode(null);
      } catch {
        toast.error("削除できませんでした");
      }
    }
  }

  if (!userId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
          Discoverへの公開にはログインが必要です
        </p>
        <LoginButton returnTo="/favorites" />
      </div>
    );
  }

  const confirmLabel =
    confirmationMode === "publish"
      ? pending
        ? "公開中…"
        : "公開する"
      : pending
        ? "取り消し中…"
        : "公開を取り消す";

  return (
    <>
      {publishedPost ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-none">
          <span
            className="inline-flex min-w-0 items-center gap-1 rounded-md border border-emerald-200/70 bg-emerald-50/70 px-1.5 py-0.5 font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            aria-label="Discoverで公開中"
          >
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">公開中</span>
            <span className="hidden sm:inline">Discoverで公開中</span>
          </span>

          <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1">
            <Link
              href={`/discover?post=${encodeURIComponent(publishedPost.id)}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 min-h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              )}
            >
              投稿を見る
            </Link>

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger
                disabled={pending}
                aria-label="Discover投稿の操作"
                aria-busy={pending}
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  "disabled:cursor-not-allowed disabled:opacity-50"
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
                  disabled={pending}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmationMode("unpublish");
                  }}
                >
                  公開を取り消す
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || pending || unavailableReason !== null}
            title={unavailableReason ?? undefined}
            aria-busy={loading || pending}
            aria-label={
              unavailableReason ??
              (pending
                ? "公開中…"
                : loading
                  ? "公開状態を確認中"
                  : "Discoverに公開")
            }
            onClick={() => setConfirmationMode("publish")}
            className="h-8 min-w-[7.5rem] max-w-full border-border/70 px-2 text-[11px] font-medium text-foreground/90 hover:bg-muted disabled:cursor-not-allowed"
          >
            {loading || pending ? (
              <ActionSpinner className="size-3.5" />
            ) : (
              <Globe2
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span className="truncate">
              {loading
                ? "確認中…"
                : pending
                  ? "公開中…"
                  : "Discoverに公開"}
            </span>
          </Button>
          {unavailableReason ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {unavailableReason}
            </p>
          ) : null}
        </div>
      )}

      <Dialog.Root
        open={confirmationMode !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmationMode(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-closed:opacity-0 data-open:opacity-100" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl outline-none">
              <Dialog.Title className="text-base font-semibold text-foreground">
                {confirmationMode === "publish"
                  ? "Discoverに公開しますか？"
                  : "公開を取り消しますか？"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {confirmationMode === "publish"
                  ? "この実況表現は他のユーザーから閲覧できるようになります。"
                  : "Discoverから投稿を削除します。お気に入り自体は削除されません。"}
              </Dialog.Description>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close
                  disabled={pending}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "min-h-11 w-full disabled:cursor-not-allowed sm:w-auto"
                  )}
                >
                  キャンセル
                </Dialog.Close>
                <Button
                  type="button"
                  variant={
                    confirmationMode === "unpublish"
                      ? "destructive"
                      : "default"
                  }
                  disabled={pending}
                  aria-busy={pending}
                  aria-label={confirmLabel}
                  onClick={() => void confirmAction()}
                  className="min-h-11 w-full min-w-[6.5rem] disabled:cursor-not-allowed sm:w-auto"
                >
                  {pending ? <ActionSpinner className="size-3.5" /> : null}
                  {confirmLabel}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
