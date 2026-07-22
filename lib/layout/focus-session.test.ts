import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isFocusSessionPath } from "@/lib/layout/focus-session";

describe("isFocusSessionPath", () => {
  it("matches quiz and daily roots and nested paths", () => {
    assert.equal(isFocusSessionPath("/quiz"), true);
    assert.equal(isFocusSessionPath("/quiz/results"), true);
    assert.equal(isFocusSessionPath("/daily"), true);
    assert.equal(isFocusSessionPath("/daily/today"), true);
  });

  it("leaves primary app routes visible", () => {
    assert.equal(isFocusSessionPath("/"), false);
    assert.equal(isFocusSessionPath("/discover"), false);
    assert.equal(isFocusSessionPath("/favorites"), false);
    assert.equal(isFocusSessionPath("/history"), false);
    assert.equal(isFocusSessionPath("/vocabulary"), false);
    assert.equal(isFocusSessionPath("/privacy"), false);
  });

  it("handles empty values", () => {
    assert.equal(isFocusSessionPath(null), false);
    assert.equal(isFocusSessionPath(undefined), false);
    assert.equal(isFocusSessionPath(""), false);
  });
});
