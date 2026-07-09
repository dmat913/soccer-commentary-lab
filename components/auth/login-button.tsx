"use client";

import { useState } from "react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LoginButtonProps = {
  className?: string;
  onSuccess?: () => void;
  fullWidth?: boolean;
};

export function LoginButton({
  className,
  onSuccess,
  fullWidth = false,
}: LoginButtonProps) {
  const { isConfigured, configError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn() {
    if (!isConfigured) {
      setErrorMessage(configError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign in failed. Please try again.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("space-y-2", fullWidth && "w-full", className)}>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSignIn}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-emerald-200/90 bg-white px-3.5 text-sm font-medium text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-emerald-800 dark:bg-background dark:text-emerald-100 dark:hover:bg-emerald-950/50 sm:px-4",
          fullWidth && "w-full"
        )}
      >
        <GoogleIcon className="size-4" />
        <span className="truncate">
          {isSubmitting ? "Redirecting..." : "Sign in with Google"}
        </span>
      </button>
      {errorMessage ? (
        <p className="text-xs leading-relaxed text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
