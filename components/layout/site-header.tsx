"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { AuthControls } from "@/components/auth/auth-controls";
import { KickLingoMark } from "@/components/brand/kicklingo-mark";
import { siteNavItems } from "@/components/layout/nav-items";
import { useQuizLeaveGuardNavigation } from "@/components/quiz/quiz-leave-guard-provider";
import { cn } from "@/lib/utils";

function getNavLinkClassName(isActive: boolean) {
  return cn(
    "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    isActive
      ? "bg-primary/[0.12] text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const tryInterceptNavigation = useQuizLeaveGuardNavigation();

  function handleGuardedNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (pathname === href) {
      return;
    }
    if (tryInterceptNavigation(href)) {
      event.preventDefault();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          aria-label="KickLingo ホーム"
          onClick={(event) => handleGuardedNavClick(event, "/")}
          className="flex min-w-0 shrink items-center gap-1.5 rounded-md transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <KickLingoMark className="size-6 shrink-0" />
          <span className="truncate text-base font-bold tracking-tight whitespace-nowrap">
            <span className="text-foreground">Kick</span>
            <span className="text-primary">Lingo</span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 justify-center md:flex"
          aria-label="メインナビゲーション"
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
                    onClick={(event) => handleGuardedNavClick(event, item.href)}
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
