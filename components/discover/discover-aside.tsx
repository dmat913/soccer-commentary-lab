"use client";

import { Ear, Flame } from "lucide-react";

import {
  DiscoverLearningTipCard,
  DiscoverSidebarListCard,
  type DiscoverSidebarItem,
} from "@/components/discover/sidebar";

type DiscoverAsideProps = {
  trendingItems: readonly DiscoverSidebarItem[];
  mostHeardItems: readonly DiscoverSidebarItem[];
};

/** Desktop-only rankings + tip — loaded after the feed critical path. */
export function DiscoverAside({
  trendingItems,
  mostHeardItems,
}: DiscoverAsideProps) {
  return (
    <aside
      aria-label="Discover sidebar"
      className="hidden min-w-0 flex-col gap-3 lg:flex"
    >
      <DiscoverSidebarListCard
        title="Trending"
        icon={Flame}
        items={trendingItems}
      />
      <DiscoverSidebarListCard
        title="Most Heard"
        icon={Ear}
        items={mostHeardItems}
      />
      <DiscoverLearningTipCard />
    </aside>
  );
}
