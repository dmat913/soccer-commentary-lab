"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";

import {
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/auth/user-profile";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  user: User;
  className?: string;
  size?: "sm" | "md";
};

export function UserAvatar({ user, className, size = "md" }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getUserAvatarUrl(user);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const showImage = avatarUrl && !imageError;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-semibold text-emerald-700 ring-2 ring-emerald-200/80 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-700/60",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-9 text-sm",
        className
      )}
      title={displayName}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span aria-label={displayName}>{initials}</span>
      )}
    </div>
  );
}
