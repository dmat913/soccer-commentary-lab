import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-foreground",
        success:
          "border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-100",
        warning:
          "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/55 dark:text-amber-100",
        danger: "border-destructive/30 bg-destructive/10 text-destructive",
        info: "border-sky-300 bg-sky-100 text-sky-950 dark:border-sky-700 dark:bg-sky-950/55 dark:text-sky-100",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
