"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { TranslationCard } from "@/components/commentary/translation-card";
import { FavoritePublishActions } from "@/components/discover/favorite-publish-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useDiscoverPublishing } from "@/hooks/use-discover-publishing";
import {
  toggleFavorite,
  useFavoriteTranslations,
} from "@/hooks/use-favorite-translations";
import { resolveFavoriteLearningPoint } from "@/lib/commentary/learning-point";
import { shouldConfirmUnfavoriteBecausePublished } from "@/lib/discover/ownership";
import { normalizeDiscoverEnglishText } from "@/lib/discover/supabase-mapping";
import { cn } from "@/lib/utils";
import type { FavoriteTranslation } from "@/types/favorite";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export function FavoriteTranslations() {
  const { user } = useAuth();
  const favorites = useFavoriteTranslations();
  const shouldReduceMotion = useReducedMotion();
  const {
    user: publishingUser,
    publishedByEnglishText,
    loading: publishingLoading,
    error: publishingError,
    publish,
    unpublish,
    isPending,
  } = useDiscoverPublishing();
  const [pendingUnfavorite, setPendingUnfavorite] =
    useState<FavoriteTranslation | null>(null);

  if (favorites.length === 0) {
    return null;
  }

  function confirmUnfavorite() {
    if (!pendingUnfavorite) {
      return;
    }

    toggleFavorite(
      {
        japaneseText: pendingUnfavorite.japaneseText,
        text: pendingUnfavorite.text,
        meaning: pendingUnfavorite.meaning,
        explanation: pendingUnfavorite.explanation,
        learningPoint: pendingUnfavorite.learningPoint ?? {
          text: "",
          meaning: "",
        },
      },
      user?.id
    );
    setPendingUnfavorite(null);
  }

  return (
    <div className="space-y-3 pb-2">
      {publishingError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-3 py-2.5 text-xs text-muted-foreground dark:border-destructive/30 dark:bg-destructive/10"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive/70"
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium text-foreground">
              公開状態を取得できませんでした
            </p>
            <p>お気に入り一覧は引き続き閲覧できます。</p>
          </div>
        </div>
      ) : null}

      <section
        aria-label="お気に入り一覧"
        className="grid min-w-0 grid-cols-1 items-start gap-2.5 sm:gap-3 lg:grid-cols-2"
      >
        <AnimatePresence initial={false}>
          {favorites.map((favorite) => {
            const learningPoint = resolveFavoriteLearningPoint(favorite);
            const publishedPost = publishedByEnglishText.get(
              normalizeDiscoverEnglishText(favorite.text)
            );
            const needsUnfavoriteConfirm =
              shouldConfirmUnfavoriteBecausePublished(
                favorite.text,
                publishedByEnglishText
              );

            return (
              <motion.div
                key={favorite.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                }
                transition={{ duration: 0.18, ease: easeOut }}
                className="min-w-0 self-start"
              >
                <TranslationCard
                  translation={{
                    text: favorite.text,
                    meaning: favorite.meaning,
                    explanation: favorite.explanation ?? "",
                    learningPoint: learningPoint ?? { text: "", meaning: "" },
                  }}
                  japaneseText={favorite.japaneseText}
                  showIndex={false}
                  compact
                  showOriginal
                  favoriteSurface
                  onRequestUnfavorite={
                    needsUnfavoriteConfirm
                      ? () => setPendingUnfavorite(favorite)
                      : undefined
                  }
                  footer={
                    <FavoritePublishActions
                      favorite={favorite}
                      userId={publishingUser?.id ?? null}
                      publishedPost={publishedPost}
                      loading={publishingLoading || Boolean(publishingError)}
                      pending={isPending(favorite.text)}
                      onPublish={publish}
                      onUnpublish={unpublish}
                    />
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      <Dialog.Root
        open={pendingUnfavorite !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingUnfavorite(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-closed:opacity-0 data-open:opacity-100" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl outline-none">
              <Dialog.Title className="text-base font-semibold text-foreground">
                お気に入りから削除しますか？
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Discoverでの公開は継続されます。公開をやめる場合は、Discoverから取り消せます。
              </Dialog.Description>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "min-h-11 w-full sm:w-auto"
                  )}
                >
                  キャンセル
                </Dialog.Close>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmUnfavorite}
                  className="min-h-11 w-full sm:w-auto"
                >
                  お気に入りから削除
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
