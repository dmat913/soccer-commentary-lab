"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CommentaryForm } from "@/components/commentary/commentary-form";
import { CommentaryResults } from "@/components/commentary/commentary-results";
import { HomeBuiltWith } from "@/components/home/home-built-with";
import { HomeComingSoon } from "@/components/home/home-coming-soon";
import { HomeEmptyExamples } from "@/components/home/home-empty-examples";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeHero } from "@/components/home/home-hero";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import { FadeIn } from "@/components/ui/motion";
import type { CommentaryTranslationItem } from "@/types/commentary";

export function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const history = useCommentaryHistory();
  const restoredIdRef = useRef<string | null>(null);

  const [japaneseText, setJapaneseText] = useState("");
  const [translations, setTranslations] = useState<CommentaryTranslationItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const showResults = isLoading || translations.length > 0;
  const showEmptyState = !showResults;

  useEffect(() => {
    const restoreId = searchParams.get("restore");
    if (!restoreId || restoredIdRef.current === restoreId) {
      return;
    }

    const item = history.find((entry) => entry.id === restoreId);
    if (!item) {
      return;
    }

    restoredIdRef.current = restoreId;
    setJapaneseText(item.japaneseText);
    setTranslations(item.translations);
    router.replace("/", { scroll: false });

    requestAnimationFrame(() => {
      document.getElementById("commentary-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [searchParams, history, router]);

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <HomeHero />

        <FadeIn delay={0.1} duration={0.55} y={16}>
          <div className="space-y-3">
            <CommentaryForm
              japaneseText={japaneseText}
              onJapaneseTextChange={setJapaneseText}
              onTranslationsChange={setTranslations}
              onLoadingChange={setIsLoading}
            />
            {showEmptyState ? (
              <HomeEmptyExamples
                japaneseText={japaneseText}
                onSelectExample={setJapaneseText}
              />
            ) : null}
          </div>
        </FadeIn>
      </div>

      {showResults ? (
        <div id="commentary-results">
          <CommentaryResults
            japaneseText={japaneseText}
            translations={translations}
            isLoading={isLoading}
          />
        </div>
      ) : null}

      <HomeFeatures />

      <HomeComingSoon />

      <HomeBuiltWith />
    </>
  );
}
