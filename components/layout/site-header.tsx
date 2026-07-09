"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { AuthControls } from "@/components/auth/auth-controls";
import { siteNavItems } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function getNavLinkClassName(isActive: boolean, layout: "inline" | "stacked") {
  return cn(
    "flex items-center gap-2 text-sm font-medium transition-colors",
    layout === "inline" && "rounded-lg px-3 py-1.5",
    layout === "stacked" && "rounded-xl px-3 py-2.5",
    isActive
      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 dark:bg-emerald-500 dark:text-emerald-950 dark:shadow-emerald-500/20"
      : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-200/50 bg-background/85 backdrop-blur-md dark:border-emerald-900/50">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="min-w-0 max-w-[42%] truncate text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 sm:max-w-none sm:truncate-none sm:whitespace-nowrap dark:text-emerald-300 dark:hover:text-emerald-200"
          onClick={closeMenu}
        >
          Soccer Commentary Lab
        </Link>

        <nav
          className="hidden flex-1 justify-center md:flex"
          aria-label="Main navigation"
        >
          <div className="flex gap-1">
            {siteNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    href={item.href}
                    className={getNavLinkClassName(isActive, "inline")}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex h-9 shrink-0 items-center gap-2">
          <div className="hidden md:block">
            <AuthControls layout="inline" />
          </div>

          {user ? (
            <div className="md:hidden">
              <AuthControls layout="compact" onAction={closeMenu} />
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 md:hidden dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-nav"
          className="space-y-3 border-t border-emerald-200/50 px-4 py-3 md:hidden dark:border-emerald-900/50"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {siteNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={getNavLinkClassName(isActive, "stacked")}
                    onClick={closeMenu}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!user ? (
            <div className="border-t border-emerald-200/50 pt-3 dark:border-emerald-900/50">
              <AuthControls layout="stacked" onAction={closeMenu} />
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
