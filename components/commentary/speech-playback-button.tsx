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
  variant?: "default" | "icon";
  className?: string;
};

export function SpeechPlaybackButton({
  text,
  variant = "default",
  className,
}: SpeechPlaybackButtonProps) {
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

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={handleClick}
        aria-label={isSpeaking ? "読み上げを停止" : "英語実況を再生"}
        aria-pressed={isSpeaking}
        className={cn(
          "size-11 min-h-11 min-w-11 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground",
          isSpeaking &&
            "bg-primary/[0.12] text-primary hover:bg-primary/[0.16] hover:text-primary",
          className
        )}
      >
        {isSpeaking ? (
          <Square
            className="size-5 animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Volume2 className="size-5" aria-hidden="true" />
        )}
      </Button>
    );
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
        "rounded-full border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        isSpeaking &&
          "border-primary/40 bg-primary/[0.12] text-primary hover:bg-primary/[0.16] hover:text-primary",
        className
      )}
    >
      {isSpeaking ? (
        <>
          <Square
            className="size-3.5 animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
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
