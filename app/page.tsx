import { Suspense } from "react";

import { HomeContent } from "@/components/commentary/home-content";
import { HomeBuiltWith } from "@/components/home/home-built-with";
import { HomeComingSoon } from "@/components/home/home-coming-soon";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeHero } from "@/components/home/home-hero";
import { homeShellClassName } from "@/lib/design/surfaces";

export default function Home() {
  return (
    <div className={homeShellClassName}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(ellipse_at_top,oklch(0.92_0.04_155_/_0.7),transparent_72%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.42_0.06_155_/_0.28),transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-16 left-1/2 h-56 w-[min(90%,32rem)] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <main className="relative mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 overflow-x-hidden px-4 py-3.5 sm:gap-8 sm:px-6 sm:py-9 lg:gap-9 lg:py-10">
        <Suspense>
          <HomeContent
            hero={<HomeHero />}
            below={
              <>
                <HomeFeatures />
                <HomeComingSoon />
                <HomeBuiltWith />
              </>
            }
          />
        </Suspense>
      </main>
    </div>
  );
}
