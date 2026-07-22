/**
 * Discover feed post for UI.
 *
 * heardCount / saveCount / recentHeardCount are independent metrics:
 * - heardCount: current Heard reactions (discover_heard_events)
 * - recentHeardCount: Heard reactions in the last 7 days (trending)
 * - saveCount: Vocabulary membership (discover_saves)
 *
 * Counts are merged in the Discover repository via:
 * - get_discover_post_heard_counts()
 * - get_discover_post_trending_stats()
 * - get_discover_post_save_counts()
 */
export type DiscoverSortOption = "trending" | "newest" | "popular";

/**
 * Discover commentary situation categories.
 * Internal values are stored on discover_posts.category; labels are UI-only.
 */
export type DiscoverCategory =
  | "goal"
  | "shot"
  | "pass"
  | "dribble"
  | "save"
  | "defending"
  | "set-piece"
  | "general";

/** Filter value including "show all". */
export type DiscoverCategoryFilter = DiscoverCategory | "all";

export const DISCOVER_CATEGORIES = [
  "goal",
  "shot",
  "pass",
  "dribble",
  "save",
  "defending",
  "set-piece",
  "general",
] as const satisfies readonly DiscoverCategory[];

export const DISCOVER_CATEGORY_LABELS: Record<DiscoverCategory, string> = {
  goal: "Goal",
  shot: "Shot",
  pass: "Pass",
  dribble: "Dribble",
  save: "Save",
  defending: "Defending",
  "set-piece": "Set Piece",
  general: "General",
};

/**
 * Match priority when multiple keyword sets hit.
 * save before shot; goal before shot (scoring language wins).
 */
export const DISCOVER_CATEGORY_PRIORITY = [
  "set-piece",
  "save",
  "goal",
  "shot",
  "pass",
  "dribble",
  "defending",
  "general",
] as const satisfies readonly DiscoverCategory[];

export type DiscoverPost = {
  id: string;
  englishText: string;
  japaneseText: string;
  meaning: string;
  learningPointText: string;
  learningPointMeaning: string;
  category: DiscoverCategory;
  /** People who currently mark this post as Heard. */
  heardCount: number;
  /** Heard reactions created in the last 7 days (for Trending). */
  recentHeardCount: number;
  /** People who currently have this post in Vocabulary. */
  saveCount: number;
  createdAt: string;
};

export type DiscoverPublishedPost = {
  id: string;
  englishText: string;
  sourceFavoriteId: string | null;
  createdAt: string;
};

export type DiscoverPublishResult = {
  post: DiscoverPublishedPost;
  alreadyPublished: boolean;
};

export type DiscoverHeardToggleResult = {
  alreadyHeard: boolean;
};

export type DiscoverSaveResult = {
  alreadySaved: boolean;
};
