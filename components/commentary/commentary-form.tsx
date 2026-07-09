"use client";

import { useState } from "react";

import { TranslationCard } from "@/components/commentary/translation-card";
import { TranslationLoadingState } from "@/components/commentary/translation-loading-state";
import { SpeechInputButton } from "@/components/commentary/speech-input-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, MotionButtonWrapper } from "@/components/ui/motion";
import { Textarea } from "@/components/ui/textarea";
import { addHistory } from "@/hooks/use-commentary-history";
import { useAuth } from "@/hooks/use-auth";
import { translateCommentaryAction } from "@/lib/actions/commentary";
import type { CommentaryTranslationItem } from "@/types/commentary";

type CommentaryFormProps = {
  japaneseText: string;
  onJapaneseTextChange: (value: string) => void;
  translations: CommentaryTranslationItem[];
  onTranslationsChange: (value: CommentaryTranslationItem[]) => void;
};

export function CommentaryForm({
  japaneseText,
  onJapaneseTextChange,
  translations,
  onTranslationsChange,
}: CommentaryFormProps) {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTranslate() {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  return (
    <div id="commentary-form" className="space-y-7">
      <div className="space-y-3">
        <label htmlFor="japanese-commentary" className="text-sm font-semibold">
          日本語実況
        </label>
        <div className="flex items-start gap-3">
          <Textarea
            id="japanese-commentary"
            placeholder="例：素晴らしいスルーパス！"
            value={japaneseText}
            onChange={(e) => onJapaneseTextChange(e.target.value)}
            rows={6}
            className="min-h-36 flex-1 resize-y rounded-2xl border-emerald-100/80 bg-background/80 text-base shadow-inner shadow-emerald-50/50 focus-visible:border-emerald-300 dark:border-emerald-900/50 dark:shadow-emerald-950/20"
          />
          <SpeechInputButton
            currentText={japaneseText}
            onTranscript={onJapaneseTextChange}
          />
        </div>
      </div>

      <MotionButtonWrapper className="w-full">
        <Button
          onClick={handleTranslate}
          disabled={isLoading}
          size="lg"
          className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/35"
        >
          {isLoading ? "変換中..." : "変換"}
        </Button>
      </MotionButtonWrapper>

      {errorMessage && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">変換結果</h2>
          <TranslationLoadingState />
        </div>
      )}

      {!isLoading && translations.length > 0 && (
        <FadeIn className="space-y-4">
          <h2 className="text-lg font-semibold">変換結果</h2>
          <div className="grid gap-4">
            {translations.map((translation, index) => (
              <FadeIn key={`${translation.text}-${index}`} delay={index * 0.05}>
                <TranslationCard
                  translation={translation}
                  index={index}
                  japaneseText={japaneseText.trim()}
                />
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
