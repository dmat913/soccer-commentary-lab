"use client";

import { useSyncExternalStore } from "react";

import {
  getCommentaryHistorySnapshot,
  getServerCommentaryHistorySnapshot,
  subscribeCommentaryHistory,
} from "@/lib/history/storage";
import type { CommentaryHistoryItem } from "@/types/history";

export function useCommentaryHistory(): CommentaryHistoryItem[] {
  return useSyncExternalStore(
    subscribeCommentaryHistory,
    getCommentaryHistorySnapshot,
    getServerCommentaryHistorySnapshot
  );
}
