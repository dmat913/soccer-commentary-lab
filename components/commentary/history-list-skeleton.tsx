import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className
      )}
    />
  );
}

function HistoryCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="w-full min-w-0 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <SkeletonLine className="h-2.5 w-28" />
        <SkeletonLine className="size-8 rounded-full" />
      </div>
      <SkeletonLine className="mt-2 h-4 w-4/5" />
      <div className="mt-2 space-y-1.5">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-11/12" />
        <SkeletonLine className="h-3 w-3/4" />
      </div>
      <SkeletonLine className="mt-2.5 h-9 w-full rounded-full sm:ml-auto sm:w-36" />
    </article>
  );
}

type HistoryListSkeletonProps = {
  count?: number;
};

/** Compact list skeletons matching History card structure (date / JP / candidates). */
export function HistoryListSkeleton({ count = 3 }: HistoryListSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid min-w-0 gap-2"
    >
      <span className="sr-only">履歴を読み込み中</span>
      {Array.from({ length: count }, (_, index) => (
        <HistoryCardSkeleton key={index} />
      ))}
    </div>
  );
}
