"use client";

import { AuthSkeleton } from "@/components/auth/auth-skeleton";
import { LoginButton } from "@/components/auth/login-button";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type AuthControlsProps = {
  className?: string;
  layout?: "inline" | "stacked" | "compact";
  onAction?: () => void;
};

export function AuthControls({
  className,
  layout = "inline",
  onAction,
}: AuthControlsProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AuthSkeleton
        className={className}
        compact={layout === "compact"}
      />
    );
  }

  if (user) {
    return (
      <UserMenu
        className={className}
        layout={layout}
        onSignOut={onAction}
      />
    );
  }

  return (
    <LoginButton
      className={className}
      fullWidth={layout === "stacked"}
      onSuccess={onAction}
    />
  );
}
