import {
  advanceDailyChallenge,
  answerDailyQuestion,
  clearDailyChallenge,
  getDailyChallengeSnapshot,
  getServerDailyChallengeSnapshot,
  invalidateStaleDailyChallenge,
  startDailyChallenge,
  subscribeDailyChallenge,
} from "@/lib/daily/storage";
import type { DailyChallengeRepository } from "@/lib/repositories/types";

/**
 * Thin local wrapper around `lib/daily/storage`. Holds no extra state;
 * subscribe / snapshot / mutations all delegate to the shared store so
 * Vocabulary and Daily pages share the same notifications.
 */
export const localDailyChallengeRepository: DailyChallengeRepository = {
  subscribe: subscribeDailyChallenge,
  getSnapshot: getDailyChallengeSnapshot,
  getServerSnapshot: getServerDailyChallengeSnapshot,
  start: startDailyChallenge,
  answer: answerDailyQuestion,
  advance: advanceDailyChallenge,
  invalidateStale: invalidateStaleDailyChallenge,
  clear: clearDailyChallenge,
};
