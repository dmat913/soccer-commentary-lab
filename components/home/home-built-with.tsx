import { FadeIn } from "@/components/ui/motion";

const technologies = ["OpenAI", "Next.js", "Supabase"] as const;

export function HomeBuiltWith() {
  return (
    <FadeIn delay={0.22}>
      <section
        aria-label="Built with"
        className="flex flex-col items-center gap-2 border-t border-emerald-200/50 pt-7 dark:border-emerald-900/50"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Built with
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {technologies.map((name) => (
            <li key={name}>
              <span className="inline-flex rounded-full border border-emerald-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-emerald-800 transition-colors duration-200 ease-out dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </FadeIn>
  );
}
