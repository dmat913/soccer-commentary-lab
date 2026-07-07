"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AuthControls } from "@/components/auth/auth-controls";
import { siteNavItems } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function getNavLinkClassName(isActive: boolean, layout: "inline" | "stacked") {
  return cn(
    "text-sm font-medium transition-colors",
    layout === "inline" && "rounded-md px-3 py-1.5",
    layout === "stacked" && "block rounded-lg px-3 py-2.5",
    isActive
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-200/60 bg-background/80 backdrop-blur-sm dark:border-emerald-900/60">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="min-w-0 shrink truncate text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
          onClick={closeMenu}
        >
          Soccer Commentary Lab
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex gap-1" aria-label="Main navigation">
            {siteNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getNavLinkClassName(isActive, "inline")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AuthControls layout="inline" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 md:hidden dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </Button>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-nav"
          className="space-y-3 border-t border-emerald-200/60 px-4 py-3 md:hidden dark:border-emerald-900/60"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {siteNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={getNavLinkClassName(isActive, "stacked")}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-emerald-200/60 pt-3 dark:border-emerald-900/60">
            <AuthControls layout="stacked" onAction={closeMenu} />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
