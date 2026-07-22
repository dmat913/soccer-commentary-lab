import type { CSSProperties } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { surfaceCardClassName } from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";

type TranslationCardSkeletonProps = {
  index: number;
  compact?: boolean;
};

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

export function TranslationCardSkeleton({
  index,
  compact = false,
}: TranslationCardSkeletonProps) {
  const delayStyle = {
    "--skeleton-delay": `${index * 0.15}s`,
  } as CSSProperties;

  return (
    <Card
      style={delayStyle}
      className={cn(
        "flex h-full min-w-0 max-w-full flex-col overflow-hidden",
        surfaceCardClassName
      )}
    >
      <CardContent
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          compact ? "space-y-3 p-3.5 sm:p-4" : "space-y-6 p-5 sm:p-7"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <SkeletonLine className={cn("h-5 w-8 rounded-md", compact && "h-5")} />
          <div className="flex gap-1">
            <SkeletonLine className="size-11 rounded-full" />
            <SkeletonLine className="size-11 rounded-full" />
            <SkeletonLine className="size-11 rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          <SkeletonLine
            className={cn("w-4/5", compact ? "h-6 sm:h-7" : "h-8 sm:h-9")}
          />
          <SkeletonLine className="h-3.5 w-2/5" />
        </div>

        <div
          className={cn(
            "space-y-1.5 rounded-xl border border-border/70 bg-muted/40",
            compact ? "px-3 py-1.5" : "px-4 py-3"
          )}
        >
          <SkeletonLine className="h-2.5 w-14" />
          <SkeletonLine className="h-4 w-11/12" />
        </div>

        <div
          className={cn(
            "space-y-2 rounded-xl border border-border/80 bg-background",
            compact ? "p-2.5" : "p-4"
          )}
        >
          <SkeletonLine className="h-4 w-28 rounded-full sm:h-5 sm:w-32" />
          <SkeletonLine className={cn("w-40", compact ? "h-4" : "h-6")} />
          <SkeletonLine className="h-3 w-24" />
        </div>

        <div className="space-y-2">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-11/12" />
        </div>

        <div className="mt-auto space-y-2 pt-1">
          <SkeletonLine
            className={cn("w-full rounded-xl", compact ? "h-11" : "h-11")}
          />
          <SkeletonLine className="h-2.5 w-14" />
          <SkeletonLine
            className={cn("w-full rounded-xl", compact ? "h-10" : "h-11")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
