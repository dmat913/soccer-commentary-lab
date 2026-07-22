import type { DiscoverPost } from "@/types/discover";

export type DiscoverHeardCountSnapshot = {
  wasHeard: boolean;
  previousHeardCount: number;
  previousRecentHeardCount: number;
};

export type ApplyHeardCountDeltaOptions = {
  /** When true, also adjust recentHeardCount (session add / session undo). */
  adjustRecent?: boolean;
};

export function createHeardPostIdSet(
  postIds: readonly string[]
): Set<string> {
  return new Set(postIds);
}

export function isPostHeard(
  heardPostIds: ReadonlySet<string>,
  postId: string
): boolean {
  return heardPostIds.has(postId);
}

export function withHeardPostId(
  heardPostIds: ReadonlySet<string>,
  postId: string,
  heard: boolean
): Set<string> {
  const next = new Set(heardPostIds);
  if (heard) {
    next.add(postId);
  } else {
    next.delete(postId);
  }
  return next;
}

export function adjustDiscoverHeardCount(
  count: number,
  delta: number
): number {
  return Math.max(0, count + delta);
}

export function applyHeardCountDeltaToPosts(
  posts: readonly DiscoverPost[],
  postId: string,
  delta: number,
  options: ApplyHeardCountDeltaOptions = {}
): DiscoverPost[] {
  const adjustRecent = options.adjustRecent ?? true;

  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          heardCount: adjustDiscoverHeardCount(post.heardCount, delta),
          recentHeardCount: adjustRecent
            ? adjustDiscoverHeardCount(post.recentHeardCount, delta)
            : post.recentHeardCount,
        }
      : post
  );
}

export function snapshotHeardToggle(
  heardPostIds: ReadonlySet<string>,
  posts: readonly DiscoverPost[],
  postId: string
): DiscoverHeardCountSnapshot | null {
  const post = posts.find((item) => item.id === postId);
  if (!post) {
    return null;
  }

  return {
    wasHeard: isPostHeard(heardPostIds, postId),
    previousHeardCount: post.heardCount,
    previousRecentHeardCount: post.recentHeardCount,
  };
}

export function restoreHeardCountOnPosts(
  posts: readonly DiscoverPost[],
  postId: string,
  previousHeardCount: number,
  previousRecentHeardCount?: number
): DiscoverPost[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          heardCount: Math.max(0, previousHeardCount),
          recentHeardCount:
            previousRecentHeardCount === undefined
              ? post.recentHeardCount
              : Math.max(0, previousRecentHeardCount),
        }
      : post
  );
}
