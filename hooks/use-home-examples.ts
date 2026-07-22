"use client";

import { useState, useSyncExternalStore } from "react";

import { getExamplesByPlacement } from "@/lib/examples/example-data";
import {
  pickChipExamples,
  pickExtendedExamples,
} from "@/lib/examples/random";
import type { ExampleItem } from "@/lib/examples/types";

type HomeExamples = {
  chipExamples: ExampleItem[];
  extendedExamples: ExampleItem[];
};

/**
 * Deterministic first-N picks for SSR and the hydration render.
 * Random selection (sessionStorage + Math.random) must wait until the
 * client has hydrated, or server/client text will diverge.
 */
function createStableHomeExamples(
  chipCount = 3,
  extendedCount = 3
): HomeExamples {
  return {
    chipExamples: getExamplesByPlacement("chip").slice(0, chipCount),
    extendedExamples: getExamplesByPlacement("extended").slice(
      0,
      extendedCount
    ),
  };
}

const STABLE_HOME_EXAMPLES = createStableHomeExamples();

let cachedRandomHomeExamples: HomeExamples | null = null;

function getRandomHomeExamples(): HomeExamples {
  if (cachedRandomHomeExamples === null) {
    cachedRandomHomeExamples = {
      chipExamples: pickChipExamples(3),
      extendedExamples: pickExtendedExamples(3),
    };
  }
  return cachedRandomHomeExamples;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function useHomeExamples(): HomeExamples {
  const isClient = useIsClient();
  const [examples, setExamples] = useState(STABLE_HOME_EXAMPLES);

  // After hydration, replace the stable snapshot with a session-aware random
  // pick. Adjusting state during render matches React's store→state pattern
  // and keeps the first client paint identical to the server HTML.
  if (isClient && examples === STABLE_HOME_EXAMPLES) {
    setExamples(getRandomHomeExamples());
  }

  return examples;
}
