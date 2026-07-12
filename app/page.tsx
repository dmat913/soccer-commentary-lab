import { Suspense } from "react";

import { HomeContent } from "@/components/commentary/home-content";

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-emerald-100/80 via-emerald-50/40 to-background dark:from-emerald-950/50 dark:via-emerald-950/25 dark:to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-200/70 via-emerald-100/25 to-transparent dark:from-emerald-800/30 dark:via-emerald-900/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 right-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.18),transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 left-[5%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(52,211,153,0.08),transparent_70%)]"
      />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:gap-9 sm:px-6 sm:py-11 lg:gap-10 lg:py-12">
        <Suspense>
          <HomeContent />
        </Suspense>
      </main>
    </div>
  );
}
