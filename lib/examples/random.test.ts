import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EXAMPLE_ITEMS, getExamplesByPlacement } from "@/lib/examples/example-data";
import { pickRandomExamples, shuffleExamples } from "@/lib/examples/random";
import type {
  ExampleCategory,
  ExampleDifficulty,
  ExampleItem,
  ExamplePlacement,
} from "@/lib/examples/types";

function makePool(size: number): ExampleItem[] {
  return Array.from({ length: size }, (_, index) => ({
    id: `example-${index}`,
    text: `Example ${index}`,
    category: "general",
    difficulty: "easy",
    placement: index % 2 === 0 ? "chip" : "extended",
  }));
}

describe("shuffleExamples", () => {
  it("does not mutate the source array", () => {
    const source = makePool(4);
    const copy = [...source];
    shuffleExamples(source);
    assert.deepEqual(source, copy);
  });
});

describe("pickRandomExamples", () => {
  it("returns up to the requested count", () => {
    const picked = pickRandomExamples(makePool(8), 3);
    assert.equal(picked.length, 3);
  });

  it("returns unique items", () => {
    const picked = pickRandomExamples(makePool(8), 3);
    const ids = new Set(picked.map((item) => item.id));
    assert.equal(ids.size, picked.length);
  });

  it("avoids repeating the previous full selection when possible", () => {
    const pool = makePool(6);
    const previous = pool.slice(0, 3).map((item) => item.id);
    const picked = pickRandomExamples(pool, 3, previous);
    assert.equal(
      picked.every((item) => previous.includes(item.id)),
      false
    );
  });

  it("still returns items when the pool is smaller than the exclude list", () => {
    const pool = makePool(3);
    const picked = pickRandomExamples(pool, 3, pool.map((item) => item.id));
    assert.equal(picked.length, 3);
  });

  it("rotates when the pool size equals the requested count", () => {
    const pool = makePool(3);
    const previous = pool.map((item) => item.id);
    const picked = pickRandomExamples(pool, 3, previous);
    assert.equal(picked.length, 3);
    assert.equal(
      ordersEqual(
        picked.map((item) => item.id),
        previous
      ),
      false
    );
  });
});

describe("example catalog", () => {
  it("keeps ids unique and total count in range", () => {
    assert.ok(EXAMPLE_ITEMS.length >= 145);
    assert.ok(EXAMPLE_ITEMS.length <= 160);
    const ids = new Set(EXAMPLE_ITEMS.map((item) => item.id));
    assert.equal(ids.size, EXAMPLE_ITEMS.length);
  });

  it("keeps all texts non-empty", () => {
    assert.equal(
      EXAMPLE_ITEMS.every((item) => item.text.trim().length > 0),
      true
    );
  });

  it("uses only allowed category, difficulty, and placement values", () => {
    const categories = new Set<ExampleCategory>([
      "goal",
      "shot",
      "pass",
      "save",
      "dribble",
      "defending",
      "set-piece",
      "general",
    ]);
    const difficulties = new Set<ExampleDifficulty>(["easy", "medium", "hard"]);
    const placements = new Set<ExamplePlacement>(["chip", "extended"]);

    assert.equal(
      EXAMPLE_ITEMS.every(
        (item) =>
          categories.has(item.category) &&
          difficulties.has(item.difficulty) &&
          placements.has(item.placement)
      ),
      true
    );
  });

  it("keeps enough examples for both placements", () => {
    assert.ok(getExamplesByPlacement("chip").length >= 3);
    assert.ok(getExamplesByPlacement("extended").length >= 3);
  });
});

function ordersEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}
