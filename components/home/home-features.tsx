import { BookOpen, Mic, Zap } from "lucide-react";

import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Zap,
    title: "Fast",
    description: "数秒で変換",
  },
  {
    icon: Mic,
    title: "Natural Commentary",
    description: "Premier League風実況",
  },
  {
    icon: BookOpen,
    title: "Learn Expressions",
    description: "Learning Point付き",
  },
] as const;

export function HomeFeatures() {
  return (
    <FadeIn delay={0.12}>
      <section aria-labelledby="home-features-heading" className="space-y-4">
        <h2 id="home-features-heading" className="sr-only">
          機能紹介
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <FadeIn key={feature.title} delay={0.14 + index * 0.05}>
                <article
                  className={cn(
                    "flex h-full flex-col gap-3 rounded-3xl border border-emerald-100/80 bg-card/90 p-5 shadow-sm shadow-emerald-100/25",
                    "transition-all duration-200 ease-out",
                    "hover:-translate-y-0.5 hover:border-emerald-200/90 hover:shadow-md hover:shadow-emerald-200/30",
                    "dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:shadow-emerald-950/25 dark:hover:border-emerald-800/70 dark:hover:shadow-emerald-900/35"
                  )}
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </section>
    </FadeIn>
  );
}
