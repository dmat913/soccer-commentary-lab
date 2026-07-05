import Link from "next/link";

import { siteNavItems } from "@/components/layout/nav-items";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Soccer Commentary Lab
          </p>
          <p className="text-sm text-muted-foreground">
            Learn football commentary English.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {siteNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-muted-foreground">
          © {currentYear} Soccer Commentary Lab
        </p>
      </div>
    </footer>
  );
}
