import { getJstDayKey } from "@/lib/daily/day-key";
import { localDailyChallengeRepository } from "@/lib/repositories/daily.local";
import type { SupabaseDailyChallengeRepository } from "@/lib/repositories/daily.supabase";
import { logSupabaseRepositoryError } from "@/lib/repositories/supabase-error";
import type { DailyChallenge } from "@/types/daily-challenge";

function getDailySyncedKey(userId: string, challengeDate: string): string {
  return `daily-challenge-synced-${userId}-${challengeDate}`;
}

export function isDailyChallengeSynced(
  userId: string,
  challengeDate: string
): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return (
      localStorage.getItem(getDailySyncedKey(userId, challengeDate)) === "true"
    );
  } catch {
    // If the flag cannot be read, allow a retry rather than skipping forever.
    return false;
  }
}

function markDailyChallengeSynced(
  userId: string,
  challengeDate: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(getDailySyncedKey(userId, challengeDate), "true");
  } catch {
    // Ignore write failures; the sync will be retried on the next login.
  }
}

export type SyncLocalDailyChallengeResult = {
  skipped: boolean;
  action: "none" | "insert" | "update" | "use-remote";
};

type SyncAction =
  | { type: "none" }
  | { type: "insert"; record: DailyChallenge }
  | { type: "update"; record: DailyChallenge }
  | { type: "use-remote" };

/**
 * Picks how to reconcile today's local and remote Daily Challenge records.
 * Completed always beats in_progress. Completed remotes are never overwritten.
 * When both are in_progress, the more advanced record wins (answers, then
 * currentQuestionIndex); ties prefer remote.
 */
export function resolveDailySyncAction(
  local: DailyChallenge | null,
  remote: DailyChallenge | null
): SyncAction {
  if (!local && !remote) {
    return { type: "none" };
  }
  if (!local) {
    return { type: "use-remote" };
  }
  if (!remote) {
    return { type: "insert", record: local };
  }

  if (local.status === "completed" && remote.status === "in_progress") {
    return { type: "update", record: local };
  }

  if (remote.status === "completed") {
    // Both completed, or remote completed vs local in_progress: remote wins.
    return { type: "use-remote" };
  }

  // Both in_progress.
  if (local.answers.length > remote.answers.length) {
    return { type: "update", record: local };
  }
  if (local.answers.length < remote.answers.length) {
    return { type: "use-remote" };
  }
  if (local.currentQuestionIndex > remote.currentQuestionIndex) {
    return { type: "update", record: local };
  }
  return { type: "use-remote" };
}

/** In-flight sync promises keyed by `${userId}:${challengeDate}`. */
const inflightSync = new Map<
  string,
  Promise<SyncLocalDailyChallengeResult>
>();

/**
 * Merges today's localStorage Daily Challenge into Supabase for the user.
 * Never deletes local data and never copies remote → local. Only today's JST
 * record is considered. Sets the synced flag only when a remote today row
 * exists after reconciliation (never for empty none-actions).
 */
export async function syncLocalDailyChallengeToSupabase(
  userId: string,
  supabaseRepo: SupabaseDailyChallengeRepository
): Promise<SyncLocalDailyChallengeResult> {
  if (typeof window === "undefined") {
    return { skipped: true, action: "none" };
  }

  const challengeDate = getJstDayKey();
  const inflightKey = `${userId}:${challengeDate}`;

  const existing = inflightSync.get(inflightKey);
  if (existing) {
    return existing;
  }

  const promise = runDailySync(userId, challengeDate, supabaseRepo).finally(
    () => {
      inflightSync.delete(inflightKey);
    }
  );
  inflightSync.set(inflightKey, promise);
  return promise;
}

async function runDailySync(
  userId: string,
  challengeDate: string,
  supabaseRepo: SupabaseDailyChallengeRepository
): Promise<SyncLocalDailyChallengeResult> {
  try {
    const local = localDailyChallengeRepository.getSnapshot();
    // Local may hold a previous day briefly; ignore anything that is not today.
    const todayLocal =
      local && local.challengeDate === challengeDate ? local : null;

    // Peek remote without relying on a prior snapshot. fetchToday updates the
    // Supabase repo snapshot to the remote state for this date.
    const remote = await supabaseRepo.fetchToday(challengeDate);

    // The synced flag must not block a push when local still has today's
    // record but remote is missing (e.g. a previous empty sync wrongly marked
    // success, or the remote row was deleted).
    if (isDailyChallengeSynced(userId, challengeDate)) {
      if (!todayLocal || remote) {
        return { skipped: true, action: "none" };
      }
    }

    let action = resolveDailySyncAction(todayLocal, remote);
    const initialAction = action.type;

    if (action.type === "none") {
      // Nothing to reconcile — do not set the synced flag, otherwise a later
      // local today record would be permanently skipped.
      return { skipped: false, action: "none" };
    }

    if (action.type === "insert") {
      await supabaseRepo.insertForSync(action.record);
      // Unique conflicts (another tab/device) are swallowed by insertForSync;
      // re-fetch and re-apply conflict rules so we can update if local is ahead,
      // or keep a completed remote untouched.
      const afterInsert = await supabaseRepo.fetchToday(challengeDate);
      action = resolveDailySyncAction(todayLocal, afterInsert);
      if (action.type === "update") {
        await supabaseRepo.updateInProgressForSync(action.record);
      }
    } else if (action.type === "update") {
      await supabaseRepo.updateInProgressForSync(action.record);
    }

    const finalRemote = await supabaseRepo.fetchToday(challengeDate);
    // Only mark synced once remote holds today's row (use-remote / insert /
    // update all end with a concrete remote record).
    if (finalRemote) {
      markDailyChallengeSynced(userId, challengeDate);
    }

    return {
      skipped: false,
      action: initialAction === "insert" ? "insert" : action.type,
    };
  } catch (error) {
    logSupabaseRepositoryError(
      "[syncLocalDailyChallengeToSupabase] sync failed",
      error,
      {
        userId,
        tableName: "daily_challenges",
        operation: "sync",
      }
    );
    throw error;
  }
}
