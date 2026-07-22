"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const Toaster = dynamic(
  () =>
    import("@/components/ui/sonner").then((mod) => ({
      default: mod.Toaster,
    })),
  { ssr: false }
);

type LazyToasterProps = ComponentProps<typeof Toaster>;

/** Defers sonner + its icons until after first paint. */
export function LazyToaster(props: LazyToasterProps) {
  return <Toaster {...props} />;
}
