"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { mobileBottomNavClearanceClassName } from "@/lib/design/surfaces";
import { isFocusSessionPath } from "@/lib/layout/focus-session";

type AppChromeProps = {
  children: ReactNode;
  footer: ReactNode;
  bottomNav: ReactNode;
};

/**
 * Route-aware shell chrome. Hides Footer + Mobile Bottom Nav on Quiz / Daily.
 * On primary routes, reserves bottom clearance once (after Footer) so content
 * and legal links are not covered by the fixed nav — pages should not also
 * add pb-24 for the same purpose.
 */
export function AppChrome({ children, footer, bottomNav }: AppChromeProps) {
  const pathname = usePathname();
  const hideChrome = isFocusSessionPath(pathname);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1">{children}</div>
        {hideChrome ? null : footer}
        {hideChrome ? null : (
          <div
            aria-hidden="true"
            className={`shrink-0 md:hidden ${mobileBottomNavClearanceClassName}`}
          />
        )}
      </div>
      {hideChrome ? null : bottomNav}
    </>
  );
}
