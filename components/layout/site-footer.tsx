import Link from "next/link";

import { KickLingoMark } from "@/components/brand/kicklingo-mark";
import { siteNavItems } from "@/components/layout/nav-items";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3.5 px-4 py-6 sm:px-6">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-base font-bold tracking-tight">
            <KickLingoMark className="size-6 shrink-0" />
            <span>
              <span className="text-[#0F172A] dark:text-white">Kick</span>
              <span className="text-emerald-600 dark:text-emerald-400">Lingo</span>
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Learn football commentary English.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for football English learners.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {siteNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-muted-foreground/55">
          © {currentYear} KickLingo
        </p>
      </div>
    </footer>
  );
}
