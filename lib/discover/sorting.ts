import type { DiscoverPost, DiscoverSortOption } from "@/types/discover";

function createdAtTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareCreatedAtDesc(left: DiscoverPost, right: DiscoverPost): number {
  return createdAtTime(right.createdAt) - createdAtTime(left.createdAt);
}

/**
 * Stable sort for Discover tabs.
 * Does not mutate the input array.
 */
export function sortDiscoverPosts(
  posts: readonly DiscoverPost[],
  sort: DiscoverSortOption
): DiscoverPost[] {
  const indexed = posts.map((post, index) => ({ post, index }));

  indexed.sort((left, right) => {
    if (sort === "newest") {
      const byCreated = compareCreatedAtDesc(left.post, right.post);
      if (byCreated !== 0) {
        return byCreated;
      }
      return left.index - right.index;
    }

    if (sort === "popular") {
      const bySave = right.post.saveCount - left.post.saveCount;
      if (bySave !== 0) {
        return bySave;
      }
      const byHeard = right.post.heardCount - left.post.heardCount;
      if (byHeard !== 0) {
        return byHeard;
      }
      const byCreated = compareCreatedAtDesc(left.post, right.post);
      if (byCreated !== 0) {
        return byCreated;
      }
      return left.index - right.index;
    }

    // trending: recent 7-day heard, then total heard, then newest
    const byRecent =
      right.post.recentHeardCount - left.post.recentHeardCount;
    if (byRecent !== 0) {
      return byRecent;
    }
    const byHeard = right.post.heardCount - left.post.heardCount;
    if (byHeard !== 0) {
      return byHeard;
    }
    const byCreated = compareCreatedAtDesc(left.post, right.post);
    if (byCreated !== 0) {
      return byCreated;
    }
    return left.index - right.index;
  });

  return indexed.map((entry) => entry.post);
}

/** Cumulative Most Heard ranking (independent from Trending). */
export function sortDiscoverPostsByMostHeard(
  posts: readonly DiscoverPost[]
): DiscoverPost[] {
  const indexed = posts.map((post, index) => ({ post, index }));

  indexed.sort((left, right) => {
    const byHeard = right.post.heardCount - left.post.heardCount;
    if (byHeard !== 0) {
      return byHeard;
    }
    const byCreated = compareCreatedAtDesc(left.post, right.post);
    if (byCreated !== 0) {
      return byCreated;
    }
    return left.index - right.index;
  });

  return indexed.map((entry) => entry.post);
}
