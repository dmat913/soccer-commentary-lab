"use client";

import { useState } from "react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { useAuth } from "@/hooks/use-auth";
import {
  buildAuthCallbackUrl,
  forceAuthAuthorizeRedirectTo,
  persistAuthReturnPath,
} from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LoginButtonProps = {
  className?: string;
  onSuccess?: () => void;
  fullWidth?: boolean;
  returnTo?: string;
};

export function LoginButton({
  className,
  onSuccess,
  fullWidth = false,
  returnTo = "/",
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
      persistAuthReturnPath(returnTo);
      const redirectTo = buildAuthCallbackUrl(window.location.origin);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      if (!data.url) {
        setErrorMessage("Sign in failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      onSuccess?.();
      window.location.assign(
        forceAuthAuthorizeRedirectTo(data.url, redirectTo)
      );
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
          "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/80 bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70 sm:px-4",
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
