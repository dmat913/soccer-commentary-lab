"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { CommentaryForm } from "@/components/commentary/commentary-form";
import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { HomeAiDisclaimer } from "@/components/home/home-ai-disclaimer";
import { HomeEmptyExamples } from "@/components/home/home-empty-examples";
import { useCommentaryHistory } from "@/hooks/use-commentary-history";
import { useHomeExamples } from "@/hooks/use-home-examples";
import { FadeIn } from "@/components/ui/fade-in";
import type { CommentaryTranslationItem } from "@/types/commentary";

const CommentaryResults = dynamic(
  () =>
    import("@/components/commentary/commentary-results").then((mod) => ({
      default: mod.CommentaryResults,
    })),
  { ssr: false }
);

type HomeContentProps = {
  /** Server-composed hero; stays stable while form state updates. */
  hero: ReactNode;
  /** Server-composed sections below the form/results. */
  below: ReactNode;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HomeContent({ hero, below }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const history = useCommentaryHistory();
  const { chipExamples, extendedExamples } = useHomeExamples();

  const [japaneseText, setJapaneseText] = useState("");
  const [translations, setTranslations] = useState<CommentaryTranslationItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [appliedRestoreId, setAppliedRestoreId] = useState<string | null>(null);

  const restoreId = searchParams.get("restore");
  const restoreItem =
    restoreId && appliedRestoreId !== restoreId
      ? history.find((entry) => entry.id === restoreId)
      : undefined;

  // Seed editable form state from ?restore= when history has the matching item.
  // Adjusting state during render is the recommended alternative to an Effect
  // that only copies props/store values into local state.
  if (restoreId && restoreItem && appliedRestoreId !== restoreId) {
    setAppliedRestoreId(restoreId);
    setJapaneseText(restoreItem.japaneseText);
    setTranslations(restoreItem.translations);
  }

  const showResults = isLoading || translations.length > 0;
  const showEmptyState = !showResults;

  useEffect(() => {
    if (!restoreId || appliedRestoreId !== restoreId) {
      return;
    }

    router.replace("/", { scroll: false });

    requestAnimationFrame(() => {
      document.getElementById("commentary-results")?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [restoreId, appliedRestoreId, router]);

  return (
    <>
      <div className="space-y-2.5 sm:space-y-5">
        {hero}

        <AuthErrorBanner />

        <FadeIn delay={0.06} duration={0.45} y={12}>
          <div className="space-y-2.5 sm:space-y-3">
            <CommentaryForm
              japaneseText={japaneseText}
              onJapaneseTextChange={setJapaneseText}
              onTranslationsChange={setTranslations}
              onLoadingChange={setIsLoading}
              chipExamples={chipExamples}
            />
            {showEmptyState ? (
              <HomeEmptyExamples
                japaneseText={japaneseText}
                examples={extendedExamples}
                onSelectExample={setJapaneseText}
              />
            ) : null}
            <HomeAiDisclaimer />
          </div>
        </FadeIn>
      </div>

      {showResults ? (
        <div
          id="commentary-results"
          className="scroll-mt-20 scroll-mb-28 pb-4 sm:pb-2 md:scroll-mb-8"
        >
          <CommentaryResults
            japaneseText={japaneseText}
            translations={translations}
            isLoading={isLoading}
          />
        </div>
      ) : null}

      {below}
    </>
  );
}
