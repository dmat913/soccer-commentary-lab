import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ActionSpinnerProps = {
  className?: string;
};

/** Shared in-button loading icon for async actions. */
export function ActionSpinner({ className }: ActionSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "size-4 shrink-0 animate-spin motion-reduce:animate-none",
        className
      )}
      aria-hidden="true"
    />
  );
}
