"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { SpeechInputButton } from "@/components/commentary/speech-input-button";
import { Button } from "@/components/ui/button";
import { MotionButtonWrapper } from "@/components/ui/motion";
import { Textarea } from "@/components/ui/textarea";
import { addHistory } from "@/hooks/use-commentary-history";
import { useAuth } from "@/hooks/use-auth";
import { translateCommentaryAction } from "@/lib/actions/commentary";
import { cn } from "@/lib/utils";
import type { CommentaryTranslationItem } from "@/types/commentary";

type CommentaryFormProps = {
  japaneseText: string;
  onJapaneseTextChange: (value: string) => void;
  onTranslationsChange: (value: CommentaryTranslationItem[]) => void;
  onLoadingChange?: (isLoading: boolean) => void;
};

const EXAMPLE_CHIPS = [
  "ナイスシュートですね！",
  "素晴らしいスルーパス！",
  "ゴールネットを揺らした！",
] as const;

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export function CommentaryForm({
  japaneseText,
  onJapaneseTextChange,
  onTranslationsChange,
  onLoadingChange,
}: CommentaryFormProps) {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function setLoadingState(loading: boolean) {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  }

  async function handleTranslate() {
    setLoadingState(true);
    setErrorMessage("");

    try {
      const result = await translateCommentaryAction(japaneseText);
      if (result.success) {
        onTranslationsChange(result.data.translations);
        addHistory(
          {
            japaneseText: japaneseText.trim(),
            translations: result.data.translations,
          },
          user?.id
        );
      } else {
        onTranslationsChange([]);
        setErrorMessage(result.error.message);
      }
    } finally {
      setLoadingState(false);
    }
  }

  return (
    <section
      id="commentary-form"
      aria-label="実況変換フォーム"
      className="mx-auto w-full min-w-0 max-w-3xl space-y-3"
    >
      <div className="space-y-1 text-left">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          日本語の実況を入力
        </h2>
        <p className="text-sm text-muted-foreground">
          3つの自然な英語実況に変換します
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-card/95 shadow-md shadow-emerald-200/20 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:shadow-emerald-950/30">
        <label htmlFor="japanese-commentary" className="sr-only">
          日本語実況
        </label>
        <Textarea
          id="japanese-commentary"
          placeholder="例：ナイスシュートですね！"
          value={japaneseText}
          onChange={(e) => onJapaneseTextChange(e.target.value)}
          rows={4}
          className="min-h-[84px] resize-y rounded-none border-0 bg-transparent px-4 pt-4 pb-2 text-base shadow-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-inset sm:min-h-24 md:min-h-32 dark:bg-transparent"
        />

        <div className="flex flex-wrap gap-1.5 px-4 pb-2.5 sm:gap-2 sm:pb-3">
          {EXAMPLE_CHIPS.map((example) => {
            const isActive = japaneseText === example;

            return (
              <button
                key={example}
                type="button"
                onClick={() => onJapaneseTextChange(example)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 ease-out active:scale-[0.98] sm:px-3",
                  isActive
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-200"
                    : "border-border/80 bg-muted/40 text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-800 max-sm:border-border/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                )}
              >
                {example}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-emerald-100/80 px-3 py-2 dark:border-emerald-900/50 sm:px-4 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles
              className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span className="truncate">AI Powered</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SpeechInputButton
              currentText={japaneseText}
              onTranscript={onJapaneseTextChange}
              className="size-11 min-h-11 min-w-11 rounded-full shadow-sm"
            />
            <MotionButtonWrapper>
              <Button
                onClick={handleTranslate}
                disabled={isLoading}
                className="h-11 gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-[background-color,box-shadow] hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/35 sm:px-6"
              >
                {isLoading ? (
                  <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : null}
                {isLoading ? "生成中..." : "変換する"}
                {!isLoading ? (
                  <ArrowRight className="size-4" aria-hidden="true" />
                ) : null}
              </Button>
            </MotionButtonWrapper>
          </div>
        </div>
      </div>

      {errorMessage && japaneseText.trim().length > 0 ? (
        <motion.div
          role="alert"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: easeOut }}
          className="flex min-w-0 items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3.5 dark:border-destructive/35 dark:bg-destructive/10"
        >
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-destructive/80"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              英語実況を生成できませんでした
            </p>
            <p className="text-sm leading-relaxed break-words text-muted-foreground">
              入力内容を確認して、もう一度「変換する」を押してください
            </p>
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}
