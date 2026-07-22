import type { DiscoverCategory } from "@/types/discover";

/**
 * Discover category badge colors — higher contrast than soft pastels,
 * always used with a visible text label.
 */
export function categoryBadgeClassName(category: DiscoverCategory): string {
  switch (category) {
    case "goal":
      return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-100";
    case "shot":
      return "border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-100";
    case "pass":
      return "border-sky-300 bg-sky-100 text-sky-950 dark:border-sky-700 dark:bg-sky-950/55 dark:text-sky-100";
    case "dribble":
      return "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/55 dark:text-amber-100";
    case "save":
      return "border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/55 dark:text-blue-100";
    case "defending":
      return "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100";
    case "set-piece":
      return "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-700 dark:bg-rose-950/55 dark:text-rose-100";
    case "general":
    default:
      return "border-border bg-muted text-foreground/80 dark:text-foreground/90";
  }
}
