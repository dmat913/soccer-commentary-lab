"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthControls } from "@/components/auth/auth-controls";
import { KickLingoMark } from "@/components/brand/kicklingo-mark";
import { siteNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

function getNavLinkClassName(isActive: boolean) {
  return cn(
    "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
    isActive
      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 dark:bg-emerald-500 dark:text-emerald-950 dark:shadow-emerald-500/20"
      : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-200/50 bg-background/90 backdrop-blur-sm dark:border-emerald-900/50">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          aria-label="KickLingo ホーム"
          className="flex min-w-0 shrink items-center gap-1.5 rounded-md transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <KickLingoMark className="size-6 shrink-0" />
          <span className="truncate text-base font-bold tracking-tight whitespace-nowrap">
            <span className="text-[#0F172A] dark:text-white">Kick</span>
            <span className="text-emerald-600 dark:text-emerald-400">Lingo</span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 justify-center md:flex"
          aria-label="Main navigation"
        >
          <ul className="flex items-center gap-1">
            {siteNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={getNavLinkClassName(isActive)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex h-9 shrink-0 items-center">
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
