/**
 * Minimal session shape for Practice Quiz leave-guard decisions.
 * Kept separate from page state so the logic stays testable in isolation.
 */
export type QuizLeaveGuardSession = {
  phase: "active" | "result";
  correct: number;
  incorrect: number;
  selectedOptionId: string | null;
};

export type QuizLeaveTarget =
  | { type: "href"; href: string }
  | { type: "back" };

/**
 * Enables leave confirmation while a Practice Quiz session is in progress and
 * the learner has started answering (at least one recorded answer, or a
 * selection on the current question).
 */
export function shouldEnableQuizLeaveGuard(
  session: QuizLeaveGuardSession | null
): boolean {
  if (!session) {
    return false;
  }
  if (session.phase !== "active") {
    return false;
  }

  const answeredCount = session.correct + session.incorrect;
  if (answeredCount >= 1) {
    return true;
  }

  return session.selectedOptionId !== null;
}

/**
 * Resolves an in-app or absolute href to a pathname for Next.js navigation.
 */
export function resolveQuizLeaveHref(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return new URL(href).pathname;
  }
  return href;
}

export function isExternalQuizLeaveHref(
  href: string,
  origin: string = typeof window !== "undefined" ? window.location.origin : ""
): boolean {
  if (!href.startsWith("http://") && !href.startsWith("https://")) {
    return false;
  }
  if (!origin) {
    return true;
  }
  return !href.startsWith(origin);
}
