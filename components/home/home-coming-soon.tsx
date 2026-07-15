import { Brain, FolderHeart } from "lucide-react";

import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

/** Truly not shipped yet. Vocabulary / Quiz / Daily are live elsewhere on Home. */
const upcomingFeatures = [
  {
    icon: FolderHeart,
    title: "Favorite Collections",
    description: "お気に入りをフォルダ管理",
  },
  {
    icon: Brain,
    title: "AI Explanation",
    description: "英文法をAIが詳しく解説",
  },
] as const;

export function HomeComingSoon() {
  return (
    <FadeIn delay={0.18}>
      <section aria-labelledby="coming-soon-heading" className="space-y-4">
        <h2
          id="coming-soon-heading"
          className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Coming Soon
        </h2>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <FadeIn key={feature.title} delay={0.2 + index * 0.04}>
                <li>
                  <div
                    aria-disabled="true"
                    className={cn(
                      "group flex items-start gap-3.5 rounded-2xl border border-emerald-100/50 bg-card/40 p-3.5 opacity-55",
                      "transition-all duration-200 ease-out",
                      "hover:border-emerald-200/80 hover:bg-card/60 hover:opacity-85 hover:shadow-sm hover:shadow-emerald-100/20",
                      "dark:border-emerald-900/35 dark:bg-emerald-950/10 dark:hover:border-emerald-800/60 dark:hover:shadow-emerald-950/30"
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors duration-200 ease-out group-hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-emerald-950/70">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">
                          {feature.title}
                        </p>
                        <span className="inline-flex rounded-full bg-muted/80 px-1.5 py-px text-[9px] font-medium tracking-wide text-muted-foreground/70 uppercase transition-opacity duration-200 ease-out group-hover:opacity-100">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </li>
              </FadeIn>
            );
          })}
        </ul>
      </section>
    </FadeIn>
  );
}
