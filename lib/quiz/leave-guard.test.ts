import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveQuizLeaveHref,
  shouldEnableQuizLeaveGuard,
  type QuizLeaveGuardSession,
} from "@/lib/quiz/leave-guard";

function activeSession(
  overrides: Partial<QuizLeaveGuardSession> = {}
): QuizLeaveGuardSession {
  return {
    phase: "active",
    correct: 0,
    incorrect: 0,
    selectedOptionId: null,
    ...overrides,
  };
}

describe("shouldEnableQuizLeaveGuard", () => {
  it("returns false before the quiz starts", () => {
    assert.equal(shouldEnableQuizLeaveGuard(null), false);
  });

  it("returns false on the result screen", () => {
    assert.equal(
      shouldEnableQuizLeaveGuard(
        activeSession({ phase: "result", correct: 3, incorrect: 2 })
      ),
      false
    );
  });

  it("returns false when active but no answers yet", () => {
    assert.equal(shouldEnableQuizLeaveGuard(activeSession()), false);
  });

  it("returns true after at least one answer is recorded", () => {
    assert.equal(
      shouldEnableQuizLeaveGuard(activeSession({ correct: 1 })),
      true
    );
    assert.equal(
      shouldEnableQuizLeaveGuard(activeSession({ incorrect: 1 })),
      true
    );
  });

  it("returns true when the current question has a selection", () => {
    assert.equal(
      shouldEnableQuizLeaveGuard(
        activeSession({ selectedOptionId: "q0-opt1", correct: 1 })
      ),
      true
    );
  });

  it("returns false for loading-style null session after completion", () => {
    assert.equal(shouldEnableQuizLeaveGuard(null), false);
  });
});

describe("resolveQuizLeaveHref", () => {
  it("keeps internal paths unchanged", () => {
    assert.equal(resolveQuizLeaveHref("/vocabulary"), "/vocabulary");
  });

  it("extracts pathname from absolute URLs", () => {
    assert.equal(
      resolveQuizLeaveHref("https://example.com/discover"),
      "/discover"
    );
  });
});
