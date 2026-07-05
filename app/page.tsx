import { Suspense } from "react";

import { HomeContent } from "@/components/commentary/home-content";

export default function Home() {
  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/25">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <Suspense>
          <HomeContent />
        </Suspense>
      </main>
    </div>
  );
}
