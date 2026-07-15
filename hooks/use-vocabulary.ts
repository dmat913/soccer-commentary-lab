"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getVocabularyRepository } from "@/lib/repositories";
import { isSupabaseVocabularyRepository } from "@/lib/repositories/vocabulary.supabase";
import { syncLocalVocabularyToSupabase } from "@/lib/vocabulary/sync";
import type { VocabularyAddEntry, VocabularyItem } from "@/types/vocabulary";

/**
 * Subscribes to Vocabulary via the repository factory.
 * Logged-out users read/write localStorage immediately.
 * Logged-in users load Supabase (after optional local→remote sync); `isLoading`
 * stays true until that first remote load finishes (success or failure).
 */
export function useVocabulary() {
  const { user } = useAuth();
  const repository = useMemo(
    () => getVocabularyRepository(user?.id ?? null),
    [user?.id]
  );

  const needsRemoteLoad =
    Boolean(user?.id) && isSupabaseVocabularyRepository(repository);

  // userId whose first remote fetch (or fail) has completed in this hook lifetime.
  const [readyUserId, setReadyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !isSupabaseVocabularyRepository(repository)) {
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;

    async function loadVocabulary() {
      try {
        await syncLocalVocabularyToSupabase(userId, supabaseRepo);
      } catch {
        // Sync errors are logged inside syncLocalVocabularyToSupabase.
        // Do not set the synced flag; still try to load remote vocabulary.
      }

      if (cancelled) {
        return;
      }

      try {
        await supabaseRepo.fetchAll();
      } catch {
        // fetchAll logs its own error details.
      } finally {
        if (!cancelled) {
          setReadyUserId(userId);
        }
      }
    }

    void loadVocabulary();

    return () => {
      cancelled = true;
    };
  }, [user?.id, repository]);

  const vocabularyItems = useSyncExternalStore(
    repository.subscribe.bind(repository),
    repository.getSnapshot.bind(repository),
    repository.getServerSnapshot.bind(repository)
  );

  const actions = useMemo(
    () => ({
      addVocabularyItem: (entry: VocabularyAddEntry): VocabularyItem[] =>
        repository.add(entry),
      removeVocabularyItem: (id: string): VocabularyItem[] =>
        repository.remove(id),
      isVocabularyItemSaved: (englishText: string): boolean =>
        repository.isSaved(englishText),
      applyVocabularyAnswer: (id: string, isCorrect: boolean): VocabularyItem[] =>
        repository.applyAnswer(id, isCorrect),
      markVocabularyStillLearning: (id: string): VocabularyItem[] =>
        repository.markStillLearning(id),
    }),
    [repository]
  );

  const isLoading =
    needsRemoteLoad && readyUserId !== (user?.id ?? null);

  return {
    vocabularyItems,
    isLoading,
    ...actions,
  };
}
