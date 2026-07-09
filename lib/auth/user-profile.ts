import type { User } from "@supabase/supabase-js";

function getMetadataString(
  metadata: Record<string, unknown>,
  key: string
): string | null {
  const value = metadata[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getUserAvatarUrl(user: User): string | null {
  const metadata = user.user_metadata as Record<string, unknown>;

  return (
    getMetadataString(metadata, "avatar_url") ??
    getMetadataString(metadata, "picture")
  );
}

export function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown>;

  return (
    getMetadataString(metadata, "full_name") ??
    getMetadataString(metadata, "name") ??
    user.email?.split("@")[0] ??
    "User"
  );
}

export function getUserInitials(user: User): string {
  const displayName = getUserDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
}
