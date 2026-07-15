"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const KNOWN_AUTH_ERRORS = new Set(["sign_in_failed"]);

/**
 * Surfaces a known OAuth failure from `?auth_error=` without blocking the
 * Home convert flow. Unknown values are ignored (never echoed to the UI).
 */
export function AuthErrorBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const authError = searchParams.get("auth_error");
  const shouldShow =
    !dismissed &&
    authError !== null &&
    KNOWN_AUTH_ERRORS.has(authError);

  if (!shouldShow) {
    return null;
  }

  function dismiss() {
    setDismissed(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth_error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          ログインできませんでした
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Googleログインを完了できませんでした。時間をおいて、もう一度ヘッダーの「Sign
          in with Google」からお試しください。
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="ログインエラーメッセージを閉じる"
        className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
