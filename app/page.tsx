import { Suspense } from "react";

import { HomeContent } from "@/components/commentary/home-content";

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-emerald-100/70 via-emerald-50/35 to-background dark:from-emerald-950/45 dark:via-emerald-950/20 dark:to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-200/60 via-emerald-100/20 to-transparent dark:from-emerald-800/25 dark:via-emerald-900/10"
      />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:gap-12 lg:py-20">
        <Suspense>
          <HomeContent />
        </Suspense>
      </main>
    </div>
  );
}
