"use client";

import { Square, Volume2 } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const speakingListeners = new Set<() => void>();
let currentSpeakingText: string | null = null;

function notifySpeakingListeners() {
  for (const listener of speakingListeners) {
    listener();
  }
}

function subscribeSpeakingText(listener: () => void): () => void {
  speakingListeners.add(listener);
  return () => {
    speakingListeners.delete(listener);
  };
}

function getSpeakingTextSnapshot(): string | null {
  return currentSpeakingText;
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

type SpeechPlaybackButtonProps = {
  text: string;
};

export function SpeechPlaybackButton({ text }: SpeechPlaybackButtonProps) {
  const isClient = useIsClient();
  const isSupported = isClient && isSpeechSynthesisSupported();
  const speakingText = useSyncExternalStore(
    subscribeSpeakingText,
    getSpeakingTextSnapshot,
    () => null
  );
  const isSpeaking = speakingText === text;

  useEffect(() => {
    return () => {
      if (isSpeaking && isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
        currentSpeakingText = null;
        notifySpeakingListeners();
      }
    };
  }, [isSpeaking]);

  function handleClick() {
    if (!isSpeechSynthesisSupported()) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      currentSpeakingText = null;
      notifySpeakingListeners();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    utterance.onend = () => {
      if (currentSpeakingText === text) {
        currentSpeakingText = null;
        notifySpeakingListeners();
      }
    };

    utterance.onerror = () => {
      if (currentSpeakingText === text) {
        currentSpeakingText = null;
        notifySpeakingListeners();
      }
    };

    currentSpeakingText = text;
    notifySpeakingListeners();
    window.speechSynthesis.speak(utterance);
  }

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      aria-label={isSpeaking ? "読み上げを停止" : "英語実況を再生"}
      aria-pressed={isSpeaking}
      className={cn(
        "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
        isSpeaking && "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
      )}
    >
      {isSpeaking ? (
        <>
          <Square className="size-3.5" aria-hidden="true" />
          停止
        </>
      ) : (
        <>
          <Volume2 className="size-3.5" aria-hidden="true" />
          再生
        </>
      )}
    </Button>
  );
}
