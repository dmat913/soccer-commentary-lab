"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
  onSignOut?: () => void;
  layout?: "inline" | "stacked";
};

function getDisplayName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
): string {
  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName = metadata.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return user.email ?? "Signed in";
}

export function UserMenu({
  className,
  onSignOut,
  layout = "inline",
}: UserMenuProps) {
  const router = useRouter();
  const { user, isConfigured, configError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  async function handleSignOut() {
    if (!isConfigured) {
      setErrorMessage(configError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      onSignOut?.();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign out failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        layout === "inline" && "flex items-center gap-2",
        layout === "stacked" && "space-y-2",
        className
      )}
    >
      <p
        className={cn(
          "min-w-0 text-sm text-muted-foreground",
          layout === "inline" && "max-w-[10rem] truncate sm:max-w-[14rem]",
          layout === "stacked" && "break-all"
        )}
        title={getDisplayName(user)}
      >
        {getDisplayName(user)}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300",
          layout === "stacked" && "w-full justify-start px-3"
        )}
        disabled={isSubmitting}
        onClick={handleSignOut}
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </Button>
      {errorMessage ? (
        <p className="text-xs leading-relaxed text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
