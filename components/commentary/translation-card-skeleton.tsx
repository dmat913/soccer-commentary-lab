import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TranslationCardSkeletonProps = {
  index: number;
};

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-emerald-200/60 dark:bg-emerald-800/40",
        className
      )}
    />
  );
}

export function TranslationCardSkeleton({ index }: TranslationCardSkeletonProps) {
  return (
    <Card className="border-emerald-200/70 bg-emerald-50/40 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/30">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-3 pr-10">
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-7 w-4/5 sm:h-8" />
          <SkeletonLine className="h-8 w-24" />
        </div>

        <div className="space-y-2">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-11/12" />
        </div>

        <div className="space-y-2">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-10/12" />
        </div>

        <div className="space-y-3 rounded-lg border border-emerald-200/60 bg-background/60 p-4 dark:border-emerald-800/40">
          <SkeletonLine className="h-4 w-48" />
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="h-3 w-full" />
        </div>

        <SkeletonLine className="h-9 w-full" />
      </CardContent>
      <span className="sr-only">表現 {index + 1} を読み込み中</span>
    </Card>
  );
}
