import { cn } from "@/lib/utils";

type AuthSkeletonProps = {
  className?: string;
  compact?: boolean;
};

export function AuthSkeleton({ className, compact = false }: AuthSkeletonProps) {
  return (
    <div
      className={cn(
        "flex h-9 animate-pulse items-center gap-2 rounded-full border border-emerald-100/80 bg-background px-2.5",
        compact ? "min-w-[4.25rem]" : "w-[10.5rem] sm:w-[11.5rem]",
        className
      )}
      aria-hidden="true"
    >
      <div className="size-7 shrink-0 rounded-full bg-emerald-100/90 dark:bg-emerald-900/40" />
      {!compact ? (
        <div className="h-2.5 flex-1 rounded-full bg-emerald-100/90 dark:bg-emerald-900/40" />
      ) : null}
    </div>
  );
}
