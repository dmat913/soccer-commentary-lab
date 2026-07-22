import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      style={{ animationDelay: "var(--skeleton-delay, 0s)" }}
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className
      )}
    />
  );
}

export function DiscoverFeedCardSkeleton({ index }: { index: number }) {
  const delayStyle = {
    "--skeleton-delay": `${index * 0.12}s`,
  } as CSSProperties;

  return (
    <article
      style={delayStyle}
      aria-hidden="true"
      className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-xs sm:px-3.5 sm:py-3"
    >
      <div className="flex items-center gap-2">
        <SkeletonLine className="h-5 w-14 rounded-md" />
        <SkeletonLine className="h-2.5 w-10" />
      </div>

      <div className="mt-1.5 space-y-1">
        <SkeletonLine className="h-4 w-[88%]" />
        <SkeletonLine className="h-3 w-[62%]" />
      </div>

      <SkeletonLine className="mt-1.5 h-3 w-[92%]" />

      <div className="mt-2 flex items-center justify-between gap-2">
        <SkeletonLine className="h-8 w-24 rounded-full sm:w-36" />
        <div className="flex items-center gap-1">
          <SkeletonLine className="size-9 rounded-full" />
          <SkeletonLine className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </article>
  );
}
