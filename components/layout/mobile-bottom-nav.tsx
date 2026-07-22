"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {siteNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] leading-none font-medium transition-colors duration-200 ease-out sm:min-h-[3.25rem] sm:text-[11px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                  isActive
                    ? "bg-primary/[0.08] text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4 shrink-0 sm:size-5" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
