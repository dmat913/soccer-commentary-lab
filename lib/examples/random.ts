import { getExamplesByPlacement } from "@/lib/examples/example-data";
import type { ExampleItem, ExamplePlacement } from "@/lib/examples/types";

export const EXAMPLE_SELECTION_STORAGE_KEYS = {
  chip: "kicklingo.examples.chip.last",
  extended: "kicklingo.examples.extended.last",
} as const satisfies Record<ExamplePlacement, string>;

/** Fisher–Yates shuffle returning a new array. */
export function shuffleExamples<T>(input: readonly T[]): T[] {
  const items = [...input];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function readLastExampleIds(storageKey: string): string[] {
  if (typeof sessionStorage === "undefined") {
    return [];
  }

  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function writeLastExampleIds(storageKey: string, ids: string[]): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // sessionStorage may be unavailable; random picks still work without memory.
  }
}

function setsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function ordersEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

/**
 * Picks up to `count` unique examples from `pool`, avoiding the previous
 * selection when the pool is large enough to offer a different set.
 */
export function pickRandomExamples(
  pool: readonly ExampleItem[],
  count: number,
  previousIds: readonly string[] = []
): ExampleItem[] {
  if (pool.length === 0 || count <= 0) {
    return [];
  }

  const targetCount = Math.min(count, pool.length);
  const previous = [...previousIds];

  if (pool.length <= targetCount) {
    const rotated = shuffleExamples(pool);
    if (previous.length > 0 && ordersEqual(rotated.map((item) => item.id), previous)) {
      return [...rotated.slice(1), rotated[0]];
    }
    return rotated.slice(0, targetCount);
  }

  const excluded = new Set(previous);
  let candidates = pool.filter((item) => !excluded.has(item.id));

  if (candidates.length < targetCount) {
    candidates = [...pool];
  }

  let picked = shuffleExamples(candidates).slice(0, targetCount);

  if (previous.length > 0 && setsEqual(picked.map((item) => item.id), previous)) {
    const fallbackPool = pool.filter(
      (item) => !picked.some((selected) => selected.id === item.id)
    );
    if (fallbackPool.length > 0) {
      const replacement = shuffleExamples(fallbackPool)[0];
      picked = [...picked.slice(0, -1), replacement];
    }
  }

  return picked;
}

export function pickPlacementExamples(
  placement: ExamplePlacement,
  count: number
): ExampleItem[] {
  const pool = getExamplesByPlacement(placement);
  const storageKey = EXAMPLE_SELECTION_STORAGE_KEYS[placement];
  const previousIds = readLastExampleIds(storageKey);
  const picked = pickRandomExamples(pool, count, previousIds);
  writeLastExampleIds(
    storageKey,
    picked.map((item) => item.id)
  );
  return picked;
}

export function pickChipExamples(count = 3): ExampleItem[] {
  return pickPlacementExamples("chip", count);
}

export function pickExtendedExamples(count = 3): ExampleItem[] {
  return pickPlacementExamples("extended", count);
}
