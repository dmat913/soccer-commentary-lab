import { Ear, Lightbulb, type LucideIcon } from "lucide-react";

import {
  microLabelClassName,
  surfacePanelClassName,
} from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";

export type DiscoverSidebarItem = {
  id: string;
  label: string;
  value: string;
  secondaryValue?: string;
};

export function DiscoverSidebarListCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: readonly DiscoverSidebarItem[];
}) {
  return (
    <section className={cn(surfacePanelClassName, "p-3.5 sm:p-4")}>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary/80" aria-hidden="true" />
        <h2 className={microLabelClassName}>{title}</h2>
      </div>
      <ol className="mt-2.5 space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex min-w-0 items-start gap-1.5">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] leading-snug text-foreground/90">
                {item.label}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] leading-none text-muted-foreground">
                <Ear className="size-2.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 tabular-nums">
                  <span>{item.value}</span>
                  {item.secondaryValue ? (
                    <span className="text-muted-foreground/75">
                      {" "}
                      · {item.secondaryValue}
                    </span>
                  ) : null}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DiscoverLearningTipCard() {
  return (
    <section
      className={cn(
        surfacePanelClassName,
        "border-border/60 bg-muted/20 p-3.5 shadow-none sm:p-4"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Lightbulb
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className={cn(microLabelClassName, "text-muted-foreground/80")}>
          Learning Tip
        </h2>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        英語実況は、短い一文を音読してから日本語へ戻すと定着しやすくなります。
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
        まずは多くの人が聞いた表現から声に出して練習してみましょう。
      </p>
    </section>
  );
}
