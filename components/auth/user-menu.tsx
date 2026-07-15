"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UserAvatar } from "@/components/auth/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}: UserMenuProps) {
  const router = useRouter();
  const { user, isConfigured, configError } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      setOpen(false);
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
    <div className={cn(className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className="rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="ユーザーメニューを開く"
        >
          <UserAvatar user={user} size="sm" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[280px] min-w-[260px] max-w-[300px] rounded-xl p-1 shadow-lg"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-start gap-3 px-3 py-3">
                <UserAvatar user={user} size="md" />
                <div className="min-w-0 flex-1 text-left">
                  <p
                    className="truncate text-sm font-semibold text-foreground"
                    title={displayName}
                  >
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
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem disabled>
            <User aria-hidden="true" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <p className="px-3 py-1.5 text-xs leading-relaxed text-muted-foreground">
            ログアウトしても保存データは削除されません。削除は
            <Link
              href="/contact"
              className="font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
              onClick={() => setOpen(false)}
            >
              お問い合わせ
            </Link>
            から依頼できます。
          </p>

          <DropdownMenuItem
            disabled={isSubmitting}
            onClick={() => void handleSignOut()}
          >
            <LogOut aria-hidden="true" />
            {isSubmitting ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {errorMessage ? (
        <p className="sr-only" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
