import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  vocabularyStatusBadgeClassName,
  vocabularyStatusDotClassName,
} from "@/lib/design/vocabulary-status";

describe("vocabularyStatusBadgeClassName", () => {
  it("uses distinct hue families for each status", () => {
    const neu = vocabularyStatusBadgeClassName("new");
    const learning = vocabularyStatusBadgeClassName("learning");
    const mastered = vocabularyStatusBadgeClassName("mastered");

    assert.match(neu, /sky-/);
    assert.match(learning, /amber-/);
    assert.match(mastered, /emerald-/);
    assert.notEqual(neu, learning);
    assert.notEqual(learning, mastered);
  });

  it("strengthens contrast when selected", () => {
    const idle = vocabularyStatusBadgeClassName("new", false);
    const selected = vocabularyStatusBadgeClassName("new", true);
    assert.match(selected, /sky-600|sky-500/);
    assert.notEqual(idle, selected);
  });
});

describe("vocabularyStatusDotClassName", () => {
  it("returns solid status dots", () => {
    assert.match(vocabularyStatusDotClassName("new"), /sky-500/);
    assert.match(vocabularyStatusDotClassName("learning"), /amber-500/);
    assert.match(vocabularyStatusDotClassName("mastered"), /emerald-600/);
  });
});
