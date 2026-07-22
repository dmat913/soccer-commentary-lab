"use client";

import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { ActionSpinner } from "@/components/ui/action-spinner";
import { Button } from "@/components/ui/button";
import { FadeIn, MotionButtonWrapper } from "@/components/ui/fade-in";
import { Textarea } from "@/components/ui/textarea";
import { addHistory } from "@/hooks/use-commentary-history";
import { useAuth } from "@/hooks/use-auth";
import { translateCommentaryAction } from "@/lib/actions/commentary";
import type { ExampleItem } from "@/lib/examples/types";
import { cn } from "@/lib/utils";
import type { CommentaryTranslationItem } from "@/types/commentary";

const SpeechInputButton = dynamic(
  () =>
    import("@/components/commentary/speech-input-button").then((mod) => ({
      default: mod.SpeechInputButton,
    })),
  {
    ssr: false,
    loading: () => (
      <span
        className="inline-flex size-11 min-h-11 min-w-11 shrink-0 rounded-full border border-border/70 bg-muted/40"
        aria-hidden="true"
      />
    ),
  }
);

type CommentaryFormProps = {
  japaneseText: string;
  onJapaneseTextChange: (value: string) => void;
  onTranslationsChange: (value: CommentaryTranslationItem[]) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  chipExamples: ExampleItem[];
};

export function CommentaryForm({
  japaneseText,
  onJapaneseTextChange,
  onTranslationsChange,
  onLoadingChange,
  chipExamples,
}: CommentaryFormProps) {
  const { user } = useAuth();
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
        setErrorMessage("retry");
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
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-xl">
          日本語の実況を入力
        </h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          3つの自然な英語実況に変換します
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md shadow-primary/[0.06] ring-1 ring-black/[0.03] dark:shadow-primary/10 dark:ring-white/[0.04]">
        <div className="space-y-1.5 border-b border-border/70 bg-muted/30 px-3 py-2.5 sm:space-y-2 sm:px-4 sm:py-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            例から試す
          </p>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2">
            {chipExamples.map((example) => {
              const isActive = japaneseText === example.text;

              return (
                <li key={example.id}>
                  <button
                    type="button"
                    onClick={() => onJapaneseTextChange(example.text)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex max-w-full min-h-9 items-center rounded-full border px-3 py-1.5 text-left text-xs font-medium leading-snug break-words transition-all duration-200 ease-out active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "border-primary/40 bg-primary/[0.1] text-primary shadow-xs"
                        : "border-border/80 bg-background text-foreground/80 hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground"
                    )}
                  >
                    {example.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <label htmlFor="japanese-commentary" className="sr-only">
          日本語実況
        </label>
        <Textarea
          id="japanese-commentary"
          placeholder="例：ナイスシュートですね！"
          value={japaneseText}
          onChange={(e) => onJapaneseTextChange(e.target.value)}
          rows={3}
          className="min-h-[4.25rem] resize-y rounded-none border-0 bg-transparent px-3.5 pt-3 pb-2 text-base shadow-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset sm:min-h-[5.5rem] sm:px-4 sm:pt-3.5 md:min-h-28 dark:bg-transparent"
        />

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-border/70 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles
              className="size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">AIで変換</span>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <SpeechInputButton
              currentText={japaneseText}
              onTranscript={onJapaneseTextChange}
              disabled={isLoading}
              className="size-11 min-h-11 min-w-11 rounded-full shadow-sm"
            />
            <MotionButtonWrapper>
              <Button
                onClick={handleTranslate}
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={isLoading ? "変換中…" : "変換する"}
                className="h-11 min-h-11 min-w-[7.5rem] gap-1.5 rounded-full px-4 text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 sm:h-12 sm:min-w-[8.5rem] sm:px-7"
              >
                {isLoading ? <ActionSpinner /> : null}
                {isLoading ? "変換中…" : "変換する"}
                {!isLoading ? (
                  <ArrowRight className="size-4" aria-hidden="true" />
                ) : null}
              </Button>
            </MotionButtonWrapper>
          </div>
        </div>
      </div>

      {errorMessage && japaneseText.trim().length > 0 ? (
        <FadeIn duration={0.22} y={5}>
          <div
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.04] px-4 py-3.5 dark:border-destructive/30 dark:bg-destructive/10"
          >
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-destructive/70"
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
          </div>
        </FadeIn>
      ) : null}
    </section>
  );
}
