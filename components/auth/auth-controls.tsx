"use client";

import { LoginButton } from "@/components/auth/login-button";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type AuthControlsProps = {
  className?: string;
  layout?: "inline" | "stacked";
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
      <div
        className={cn(
          "text-sm text-muted-foreground",
          layout === "stacked" && "px-3 py-2",
          className
        )}
      >
        Loading...
      </div>
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
