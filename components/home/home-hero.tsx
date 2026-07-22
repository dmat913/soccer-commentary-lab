import { Check, Goal, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/fade-in";

const infoBadges = [
  "無料で利用できます",
  "ログインするとお気に入り・履歴を保存",
] as const;

export function HomeHero() {
  return (
    <FadeIn duration={0.45} y={10}>
      <header className="relative space-y-2 text-center sm:space-y-3.5 sm:text-left">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 left-1/2 h-40 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-3xl sm:left-0 sm:translate-x-0"
        />

        <div className="relative flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-border/80 bg-background/90 px-2 py-0.5 text-[11px] text-foreground shadow-xs backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs"
          >
            <Goal className="size-3.5 text-primary" aria-hidden="true" />
            サッカー実況特化
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/20 bg-primary/[0.06] px-2 py-0.5 text-[11px] text-primary shadow-xs backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI英語変換
          </Badge>
        </div>

        <div className="relative space-y-1 sm:space-y-2.5">
          <h1 className="text-[1.625rem] font-bold tracking-tight text-foreground max-sm:leading-[1.15] sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            サッカー実況を
            <br className="sm:hidden" />
            英語で学ぶ
          </h1>
          <p className="mx-auto max-w-lg text-[13px] leading-relaxed text-muted-foreground sm:mx-0 sm:text-base sm:leading-7">
            日本語の実況を、自然な英語実況へ変換します。
          </p>
        </div>

        <ul className="relative flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          {infoBadges.map((label) => (
            <li key={label} className="min-w-0 max-w-full">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] font-medium break-words text-muted-foreground backdrop-blur-sm sm:px-3 sm:text-xs">
                <Check
                  className="size-3 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </header>
    </FadeIn>
  );
}
