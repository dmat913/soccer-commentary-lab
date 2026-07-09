"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { getUserDisplayName } from "@/lib/auth/user-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
  onSignOut?: () => void;
  layout?: "inline" | "stacked" | "compact";
};

export function UserMenu({
  className,
  onSignOut,
  layout = "inline",
}: UserMenuProps) {
  const menuId = useId();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isConfigured, configError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showNameInTrigger = layout !== "compact";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const displayName = getUserDisplayName(user);
  const email = user.email ?? "";

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

      setIsOpen(false);
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
      ref={containerRef}
      className={cn("relative", layout === "stacked" && "w-full", className)}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200/90 bg-white px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-background dark:hover:bg-emerald-950/50",
          showNameInTrigger
            ? "max-w-[11rem] sm:max-w-[12.5rem] lg:max-w-[14rem]"
            : "min-w-[4.25rem] justify-center gap-1 px-2",
          layout === "stacked" && "w-full max-w-none justify-between px-3"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <UserAvatar user={user} size="sm" />
          {showNameInTrigger ? (
            <span className="truncate" title={displayName}>
              {displayName}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 min-w-[15rem] overflow-hidden rounded-2xl border border-emerald-100/90 bg-background shadow-lg dark:border-emerald-900/60",
            layout === "stacked"
              ? "left-0 right-0 w-full"
              : "right-0 w-[17rem]"
          )}
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" title={displayName}>
                {displayName}
              </p>
              {email ? (
                <p
                  className="truncate text-xs text-muted-foreground"
                  title={email}
                >
                  {email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-emerald-100/80 dark:border-emerald-900/50" />

          <button
            type="button"
            role="menuitem"
            disabled={isSubmitting}
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-red-950/30 dark:hover:text-red-300"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            {isSubmitting ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-2 text-xs leading-relaxed text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
