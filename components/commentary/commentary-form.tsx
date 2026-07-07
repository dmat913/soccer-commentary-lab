"use client";

import { useState } from "react";

import { TranslationCard } from "@/components/commentary/translation-card";
import { TranslationLoadingState } from "@/components/commentary/translation-loading-state";
import { SpeechInputButton } from "@/components/commentary/speech-input-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addHistory } from "@/hooks/use-commentary-history";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTranslate() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await translateCommentaryAction(japaneseText);
      if (result.success) {
        onTranslationsChange(result.data.translations);
        addHistory({
          japaneseText: japaneseText.trim(),
          translations: result.data.translations,
        });
      } else {
        onTranslationsChange([]);
        setErrorMessage(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div id="commentary-form" className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="japanese-commentary" className="text-sm font-medium">
          日本語実況
        </label>
        <div className="flex items-start gap-2">
          <Textarea
            id="japanese-commentary"
            placeholder="例：素晴らしいスルーパス！"
            value={japaneseText}
            onChange={(e) => onJapaneseTextChange(e.target.value)}
            rows={5}
            className="min-h-32 flex-1 resize-y text-base"
          />
          <SpeechInputButton
            currentText={japaneseText}
            onTranscript={onJapaneseTextChange}
          />
        </div>
      </div>

      <Button
        onClick={handleTranslate}
        disabled={isLoading}
        size="lg"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto sm:min-w-32"
      >
        {isLoading ? "変換中..." : "変換"}
      </Button>

      {errorMessage && (
        <Card className="border-destructive/30 bg-destructive/5">
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">変換結果</h2>
          <div className="grid gap-4">
            {translations.map((translation, index) => (
              <TranslationCard
                key={`${translation.text}-${index}`}
                translation={translation}
                index={index}
                japaneseText={japaneseText.trim()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
