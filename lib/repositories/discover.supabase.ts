import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildHeardCountMap,
  buildRecentHeardCountMap,
  buildSaveCountMap,
  findPublishedPostByEnglishText,
  mapDiscoverMyPostRow,
  mapDiscoverPostRowToPost,
  mapFavoriteToDiscoverPostInsert,
  type DiscoverHeardCountRow,
  type DiscoverMyPostRow,
  type DiscoverPostRow,
  type DiscoverSaveCountRow,
  type DiscoverTrendingStatsRow,
} from "@/lib/discover/supabase-mapping";
import { sortDiscoverPosts } from "@/lib/discover/sorting";
import { canPublishFavoriteToDiscover } from "@/lib/favorites/supabase-mapping";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import type { DiscoverRepository } from "@/lib/repositories/types";
import { createClient } from "@/lib/supabase/client";
import type {
  DiscoverHeardToggleResult,
  DiscoverPost,
  DiscoverPublishedPost,
  DiscoverPublishResult,
  DiscoverSaveResult,
} from "@/types/discover";
import type { FavoriteTranslation } from "@/types/favorite";

const DISCOVER_POST_SELECT =
  "id, english_text, japanese_text, meaning, learning_point_text, learning_point_meaning, category, created_at";
const DISCOVER_MY_POST_SELECT =
  "id, source_favorite_id, english_text, created_at";

export class SupabaseDiscoverRepository implements DiscoverRepository {
  constructor(private readonly supabase: SupabaseClient = createClient()) {}

  async listPosts(): Promise<DiscoverPost[]> {
    return this.fetchPostsMerged();
  }

  async getTrendingPosts(): Promise<DiscoverPost[]> {
    const posts = await this.fetchPostsMerged();
    return sortDiscoverPosts(posts, "trending");
  }

  async getNewestPosts(): Promise<DiscoverPost[]> {
    const posts = await this.fetchPostsMerged();
    return sortDiscoverPosts(posts, "newest");
  }

  async getPopularPosts(): Promise<DiscoverPost[]> {
    const posts = await this.fetchPostsMerged();
    return sortDiscoverPosts(posts, "popular");
  }

  async listMyPosts(userId: string): Promise<DiscoverPublishedPost[]> {
    const { data, error } = await this.supabase
      .from("discover_posts")
      .select(DISCOVER_MY_POST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listMyPosts failed",
        error,
        {
          userId,
          tableName: "discover_posts",
          operation: "select",
        }
      );
      throw error;
    }

    return ((data as DiscoverMyPostRow[] | null) ?? []).map(
      mapDiscoverMyPostRow
    );
  }

  async isPublished(userId: string, englishText: string): Promise<boolean> {
    const posts = await this.listMyPosts(userId);
    return findPublishedPostByEnglishText(posts, englishText) !== undefined;
  }

  async publishPost(
    favorite: FavoriteTranslation,
    userId: string
  ): Promise<DiscoverPublishResult> {
    if (!userId || !canPublishFavoriteToDiscover(favorite)) {
      throw new Error("Favorite cannot be published to Discover.");
    }
    await this.assertAuthenticatedUser(userId);

    const row = mapFavoriteToDiscoverPostInsert(favorite, userId);
    const { data, error } = await this.supabase
      .from("discover_posts")
      .insert(row)
      .select(DISCOVER_MY_POST_SELECT)
      .single();

    if (!error && data) {
      return {
        post: mapDiscoverMyPostRow(data as DiscoverMyPostRow),
        alreadyPublished: false,
      };
    }

    if (error?.code === "23505") {
      const existing = findPublishedPostByEnglishText(
        await this.listMyPosts(userId),
        favorite.text
      );
      if (existing) {
        return { post: existing, alreadyPublished: true };
      }
    }

    logSupabaseRepositoryError(
      "[SupabaseDiscoverRepository] publishPost failed",
      error,
      {
        userId,
        favoriteId: favorite.id,
        tableName: "discover_posts",
        operation: "insert",
      }
    );
    throw error ?? new Error("Discover publish returned no post.");
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    if (!postId || !userId) {
      throw new Error("Discover post and user are required.");
    }
    await this.assertAuthenticatedUser(userId);

    const { data, error } = await this.supabase
      .from("discover_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] deletePost failed",
        error ?? new Error("Discover post was not deleted."),
        {
          userId,
          postId,
          tableName: "discover_posts",
          operation: "delete",
        }
      );
      throw error ?? new Error("公開投稿を削除できませんでした。");
    }
  }

  async listMyHeardPostIds(userId: string): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("discover_heard_events")
      .select("post_id")
      .eq("user_id", userId);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listMyHeardPostIds failed",
        error,
        {
          userId,
          tableName: "discover_heard_events",
          operation: "select",
        }
      );
      throw error;
    }

    const postIds: string[] = [];
    for (const row of (data as { post_id: string }[] | null) ?? []) {
      if (typeof row.post_id === "string" && row.post_id.length > 0) {
        postIds.push(row.post_id);
      }
    }
    return postIds;
  }

  async markPostAsHeard(
    postId: string,
    userId: string
  ): Promise<DiscoverHeardToggleResult> {
    if (!postId || !userId) {
      throw new Error("Discover post and user are required.");
    }
    await this.assertAuthenticatedUser(userId);

    const { error } = await this.supabase.from("discover_heard_events").insert({
      post_id: postId,
      user_id: userId,
    });

    if (!error) {
      return { alreadyHeard: false };
    }

    if (error.code === "23505") {
      return { alreadyHeard: true };
    }

    logSupabaseRepositoryError(
      "[SupabaseDiscoverRepository] markPostAsHeard failed",
      error,
      {
        userId,
        postId,
        tableName: "discover_heard_events",
        operation: "insert",
      }
    );
    throw error;
  }

  async unmarkPostAsHeard(postId: string, userId: string): Promise<void> {
    if (!postId || !userId) {
      throw new Error("Discover post and user are required.");
    }
    await this.assertAuthenticatedUser(userId);

    const { error } = await this.supabase
      .from("discover_heard_events")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] unmarkPostAsHeard failed",
        error,
        {
          userId,
          postId,
          tableName: "discover_heard_events",
          operation: "delete",
        }
      );
      throw error;
    }
  }

  async listMySavedPostIds(userId: string): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("discover_saves")
      .select("post_id")
      .eq("user_id", userId);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listMySavedPostIds failed",
        error,
        {
          userId,
          tableName: "discover_saves",
          operation: "select",
        }
      );
      throw error;
    }

    const postIds: string[] = [];
    for (const row of (data as { post_id: string }[] | null) ?? []) {
      if (typeof row.post_id === "string" && row.post_id.length > 0) {
        postIds.push(row.post_id);
      }
    }
    return postIds;
  }

  async markPostAsSaved(
    postId: string,
    userId: string
  ): Promise<DiscoverSaveResult> {
    if (!postId || !userId) {
      throw new Error("Discover post and user are required.");
    }
    await this.assertAuthenticatedUser(userId);

    const { error } = await this.supabase.from("discover_saves").insert({
      post_id: postId,
      user_id: userId,
    });

    if (!error) {
      return { alreadySaved: false };
    }

    if (error.code === "23505") {
      return { alreadySaved: true };
    }

    logSupabaseRepositoryError(
      "[SupabaseDiscoverRepository] markPostAsSaved failed",
      error,
      {
        userId,
        postId,
        tableName: "discover_saves",
        operation: "insert",
      }
    );
    throw error;
  }

  async unmarkPostAsSaved(postId: string, userId: string): Promise<void> {
    if (!postId || !userId) {
      throw new Error("Discover post and user are required.");
    }
    await this.assertAuthenticatedUser(userId);

    const { error } = await this.supabase
      .from("discover_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] unmarkPostAsSaved failed",
        error,
        {
          userId,
          postId,
          tableName: "discover_saves",
          operation: "delete",
        }
      );
      throw error;
    }
  }

  private async assertAuthenticatedUser(userId: string): Promise<void> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || user?.id !== userId) {
      throw new Error("認証セッションを確認できません。再ログインしてください。");
    }
  }

  private async fetchPostsMerged(): Promise<DiscoverPost[]> {
    const [postsResult, heardResult, saveResult, trendingResult] =
      await Promise.all([
        this.supabase
          .from("discover_posts")
          .select(DISCOVER_POST_SELECT)
          .order("created_at", { ascending: false }),
        this.supabase.rpc("get_discover_post_heard_counts"),
        this.supabase.rpc("get_discover_post_save_counts"),
        this.supabase.rpc("get_discover_post_trending_stats"),
      ]);

    if (postsResult.error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listPosts posts failed",
        postsResult.error,
        {
          tableName: "discover_posts",
          operation: "select",
        }
      );
      throw postsResult.error;
    }

    // Soft-fail count RPCs so the feed remains readable when one metric is down.
    if (heardResult.error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listPosts heard counts failed",
        heardResult.error,
        {
          rpcName: "get_discover_post_heard_counts",
          operation: "rpc",
        }
      );
    }

    if (saveResult.error) {
      logSupabaseRepositoryError(
        "[SupabaseDiscoverRepository] listPosts save counts failed",
        saveResult.error,
        {
          rpcName: "get_discover_post_save_counts",
          operation: "rpc",
        }
      );
    }

    // Soft-fail when trending RPC is missing (migration not applied yet).
    const recentByPostId = trendingResult.error
      ? new Map<string, number>()
      : buildRecentHeardCountMap(
          (trendingResult.data as DiscoverTrendingStatsRow[] | null) ?? []
        );

    const heardByPostId = heardResult.error
      ? new Map<string, number>()
      : buildHeardCountMap(
          (heardResult.data as DiscoverHeardCountRow[] | null) ?? []
        );
    const saveByPostId = saveResult.error
      ? new Map<string, number>()
      : buildSaveCountMap(
          (saveResult.data as DiscoverSaveCountRow[] | null) ?? []
        );

    const rows = (postsResult.data as DiscoverPostRow[] | null) ?? [];

    return rows.map((row) =>
      mapDiscoverPostRowToPost(row, {
        heardCount: heardByPostId.get(row.id) ?? 0,
        recentHeardCount: recentByPostId.get(row.id) ?? 0,
        saveCount: saveByPostId.get(row.id) ?? 0,
      })
    );
  }
}

export function createSupabaseDiscoverRepository(
  supabase?: SupabaseClient
): SupabaseDiscoverRepository {
  return new SupabaseDiscoverRepository(supabase ?? createClient());
}

export function isSupabaseDiscoverRepository(
  repository: DiscoverRepository
): repository is SupabaseDiscoverRepository {
  return repository instanceof SupabaseDiscoverRepository;
}
