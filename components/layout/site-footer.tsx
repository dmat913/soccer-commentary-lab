import Link from "next/link";

import { KickLingoMark } from "@/components/brand/kicklingo-mark";
import { siteNavItems } from "@/components/layout/nav-items";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-primary/[0.03]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-5 sm:gap-3.5 sm:px-6 sm:py-6">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-base font-bold tracking-tight">
            <KickLingoMark className="size-6 shrink-0" />
            <span>
              <span className="text-[#0F172A] dark:text-white">Kick</span>
              <span className="text-primary">Lingo</span>
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Learn football commentary English.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for football English learners.
          </p>
        </div>

        <nav aria-label="フッターナビゲーション">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {siteNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="法務・サポート">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <Link
                href="/privacy"
                className="text-xs text-muted-foreground/80 transition-colors duration-200 ease-out hover:text-primary"
              >
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-xs text-muted-foreground/80 transition-colors duration-200 ease-out hover:text-primary"
              >
                利用規約
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-xs text-muted-foreground/80 transition-colors duration-200 ease-out hover:text-primary"
              >
                お問い合わせ
              </Link>
            </li>
          </ul>
        </nav>

        <p className="text-xs text-muted-foreground/55">
          © {currentYear} KickLingo
        </p>
      </div>
    </footer>
  );
}
