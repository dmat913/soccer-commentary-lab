"use client";

import { useSyncExternalStore } from "react";

import { getHistoryRepository } from "@/lib/repositories";
import type { HistoryAddEntry } from "@/lib/repositories/types";
import type { CommentaryHistoryItem } from "@/types/history";

const historyRepository = getHistoryRepository();

export function useCommentaryHistory(): CommentaryHistoryItem[] {
  return useSyncExternalStore(
    historyRepository.subscribe.bind(historyRepository),
    historyRepository.getSnapshot.bind(historyRepository),
    historyRepository.getServerSnapshot.bind(historyRepository)
  );
}

export function addHistory(entry: HistoryAddEntry): CommentaryHistoryItem[] {
  return historyRepository.add(entry);
}
