"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getJstDayKey } from "@/lib/daily/day-key";
import { syncLocalDailyChallengeToSupabase } from "@/lib/daily/sync";
import { getVocabularyUpdateForDailyAnswer } from "@/lib/daily/vocabulary-learning";
import {
  getDailyChallengeRepository,
  getVocabularyRepository,
} from "@/lib/repositories";
import { isSupabaseDailyChallengeRepository } from "@/lib/repositories/daily.supabase";
import type {
  DailyChallenge,
  StartDailyChallengeInput,
} from "@/types/daily-challenge";

/**
 * Subscribes to today's Daily Challenge via the repository factory.
 * Logged-out users read/write localStorage; logged-in users use Supabase,
 * with a one-time local→remote merge for today's record on login.
 */
export function useDailyChallenge() {
  const { user } = useAuth();
  const repository = useMemo(
    () => getDailyChallengeRepository(user?.id ?? null),
    [user?.id]
  );
  const vocabularyRepository = useMemo(
    () => getVocabularyRepository(user?.id ?? null),
    [user?.id]
  );

  // Drop leftover records from a previous JST day once the client mounts /
  // when the active repository changes (e.g. login / logout).
  useEffect(() => {
    repository.invalidateStale();
  }, [repository]);

  useEffect(() => {
    if (!user?.id || !isSupabaseDailyChallengeRepository(repository)) {
      return;
    }

    const userId = user.id;
    const supabaseRepo = repository;
    let cancelled = false;

    async function loadDailyChallenge() {
      try {
        await syncLocalDailyChallengeToSupabase(userId, supabaseRepo);
      } catch {
        // Sync errors are logged inside syncLocalDailyChallengeToSupabase.
        // Do not set the synced flag; still try to load remote today's record.
      }

      if (cancelled) {
        return;
      }

      try {
        await supabaseRepo.fetchToday(getJstDayKey());
      } catch {
        // fetchToday logs its own error details.
      }
    }

    void loadDailyChallenge();

    return () => {
      cancelled = true;
    };
  }, [user?.id, repository]);

  const dailyChallenge = useSyncExternalStore(
    repository.subscribe.bind(repository),
    repository.getSnapshot.bind(repository),
    repository.getServerSnapshot.bind(repository)
  );

  // Hydration-safe client flag (false on SSR + first client paint, then true).
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const actions = useMemo(
    () => ({
      startChallenge: (input: StartDailyChallengeInput): DailyChallenge =>
        repository.start(input),
      answerQuestion: (optionId: string): void => {
        const record = repository.getSnapshot();
        const vocabularyUpdate = getVocabularyUpdateForDailyAnswer(
          record,
          optionId
        );

        repository.answer(optionId);

        if (!vocabularyUpdate) {
          return;
        }

        try {
          vocabularyRepository.applyAnswer(
            vocabularyUpdate.vocabularyId,
            vocabularyUpdate.isCorrect
          );
        } catch {
          // Learning updates must not interrupt Daily Challenge answering.
        }
      },
      advanceChallenge: (): void => repository.advance(),
      clearChallenge: (): void => repository.clear(),
    }),
    [repository, vocabularyRepository]
  );

  const isInProgress = dailyChallenge?.status === "in_progress";
  const isCompleted = dailyChallenge?.status === "completed";
  const correctCount = dailyChallenge?.correctCount ?? 0;
  const totalQuestions = dailyChallenge?.questions.length ?? 0;

  return {
    dailyChallenge,
    isHydrated,
    isInProgress,
    isCompleted,
    correctCount,
    totalQuestions,
    ...actions,
  };
}
