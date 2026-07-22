import type { DiscoverPost } from "@/types/discover";

export function createSavedPostIdSet(
  postIds: readonly string[]
): Set<string> {
  return new Set(postIds);
}

export function isPostSavedInDiscover(
  savedPostIds: ReadonlySet<string>,
  postId: string
): boolean {
  return savedPostIds.has(postId);
}

export function withSavedPostId(
  savedPostIds: ReadonlySet<string>,
  postId: string,
  saved: boolean
): Set<string> {
  const next = new Set(savedPostIds);
  if (saved) {
    next.add(postId);
  } else {
    next.delete(postId);
  }
  return next;
}

export function adjustDiscoverSaveCount(
  count: number,
  delta: number
): number {
  return Math.max(0, count + delta);
}

export function applySaveCountDeltaToPosts(
  posts: readonly DiscoverPost[],
  postId: string,
  delta: number
): DiscoverPost[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          saveCount: adjustDiscoverSaveCount(post.saveCount, delta),
        }
      : post
  );
}

export function restoreSaveCountOnPosts(
  posts: readonly DiscoverPost[],
  postId: string,
  previousCount: number
): DiscoverPost[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          saveCount: Math.max(0, previousCount),
        }
      : post
  );
}
