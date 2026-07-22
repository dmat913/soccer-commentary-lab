import { normalizeDiscoverEnglishText } from "@/lib/discover/supabase-mapping";

/**
 * Whether the viewer owns this Discover post, using a preloaded id set
 * (e.g. from listMyPosts) — no per-post SELECT.
 */
export function isOwnedDiscoverPost(
  postId: string,
  ownedPostIds: ReadonlySet<string>
): boolean {
  return ownedPostIds.has(postId);
}

/**
 * Whether unfavoriting should confirm that Discover publish continues.
 * Uses the same trim/normalize key as Favorites publish-state lookup.
 */
export function shouldConfirmUnfavoriteBecausePublished(
  englishText: string,
  publishedByEnglishText: ReadonlyMap<string, unknown>
): boolean {
  return publishedByEnglishText.has(
    normalizeDiscoverEnglishText(englishText)
  );
}

/** Optimistic removal helper for Discover feed lists. */
export function removeDiscoverPostFromList<T extends { id: string }>(
  posts: readonly T[],
  postId: string
): T[] {
  return posts.filter((post) => post.id !== postId);
}
