"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="outline"
        className={cn(
          "border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/50",
          fullWidth && "w-full"
        )}
        disabled={isSubmitting}
        onClick={handleSignIn}
      >
        {isSubmitting ? "Redirecting..." : "Sign in with Google"}
      </Button>
      {errorMessage ? (
        <p className="text-xs leading-relaxed text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
