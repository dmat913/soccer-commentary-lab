import {
  addCommentaryHistory,
  getCommentaryHistorySnapshot,
  getServerCommentaryHistorySnapshot,
  loadCommentaryHistory,
  removeCommentaryHistory,
  subscribeCommentaryHistory,
} from "@/lib/history/storage";
import type { HistoryRepository } from "@/lib/repositories/types";

export const localHistoryRepository: HistoryRepository = {
  subscribe: subscribeCommentaryHistory,
  getSnapshot: getCommentaryHistorySnapshot,
  getServerSnapshot: getServerCommentaryHistorySnapshot,
  add: addCommentaryHistory,
  remove: removeCommentaryHistory,
  load: loadCommentaryHistory,
};
