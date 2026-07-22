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

/** Mobile-first list skeleton; md+ hints at list + detail layout. */
export function VocabularyWorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-w-0 flex-col gap-2.5"
    >
      <span className="sr-only">単語帳を読み込み中</span>

      <div
        aria-hidden="true"
        className="rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 md:hidden"
      >
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="mt-2 h-3 w-40" />
        <div className="mt-2 space-y-1.5">
          <SkeletonLine className="h-10 w-full rounded-lg" />
          <SkeletonLine className="h-10 w-full rounded-lg" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "grid min-w-0 grid-cols-1",
          "rounded-2xl border border-border/70 bg-card/70",
          "md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:overflow-hidden"
        )}
      >
        <aside className="min-w-0 border-border/70 p-2.5 md:border-r">
          <div className="flex items-baseline justify-between gap-2">
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-3 w-10" />
          </div>
          <SkeletonLine className="mt-2 h-9 w-full rounded-lg" />
          <div className="mt-2 grid grid-cols-2 gap-1">
            <SkeletonLine className="h-8 rounded-lg" />
            <SkeletonLine className="h-8 rounded-lg" />
            <SkeletonLine className="h-8 rounded-lg" />
            <SkeletonLine className="h-8 rounded-lg" />
          </div>
          <div className="mt-2 space-y-1">
            {[0, 1, 2, 3].map((index) => (
              <SkeletonLine key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        <section className="hidden min-w-0 p-3.5 md:block">
          <div className="flex items-start justify-between gap-2">
            <SkeletonLine className="h-7 w-3/5" />
            <div className="flex gap-1">
              <SkeletonLine className="size-9 rounded-full" />
              <SkeletonLine className="size-9 rounded-full" />
            </div>
          </div>
          <SkeletonLine className="mt-3 h-16 w-full rounded-lg" />
          <SkeletonLine className="mt-2 h-20 w-full rounded-lg" />
          <SkeletonLine className="mt-2 h-24 w-full rounded-lg" />
        </section>
      </div>
    </div>
  );
}
