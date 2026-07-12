import { cn } from "@/lib/utils";

type AuthSkeletonProps = {
  className?: string;
  compact?: boolean;
};

export function AuthSkeleton({ className }: AuthSkeletonProps) {
  return (
    <div
      className={cn(
        "size-9 shrink-0 animate-pulse rounded-full bg-emerald-100/90 dark:bg-emerald-900/40",
        className
      )}
      aria-hidden="true"
    />
  );
}
